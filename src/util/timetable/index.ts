/**
 * @fileoverview Timetable generation utility for school scheduling
 */

/**
 * Pads a string to the right with spaces
 * @param str - The string to pad
 * @param length - The target length
 * @returns The padded string
 */
function padRight(
  str: string | number | null | undefined,
  length: number,
): string {
  if (str === undefined || str === null) {
    str = "";
  }
  return String(str).padEnd(length);
}

export const DAYS = 5;
export const PERIODS_PER_DAY = 7;

/**
 * Represents a time slot in the schedule
 */
export interface TimeSlot {
  day: number;
  period: number;
}

/**
 * Class representing availability of a teacher
 */
export class Availability {
  days: number;
  periodsPerDay: number;
  buffer: number[];

  /**
   * Create an availability instance
   * @param days - Number of days in the schedule
   * @param periodsPerDay - Number of periods per day
   */
  constructor(days: number, periodsPerDay: number) {
    this.days = days;
    this.periodsPerDay = periodsPerDay;

    this.buffer = new Array(days).fill(0);
  }

  /**
   * Set availability for a specific time slot
   * @param day - Day index
   * @param period - Period index
   * @param val - Whether the slot is available
   */
  set(day: number, period: number, val: boolean): void {
    const mask = 1 << period;
    if (val) {
      this.buffer[day] |= mask;
    } else {
      this.buffer[day] &= ~mask;
    }
  }

  /**
   * Set availability for an entire day
   * @param day - Day index
   * @param val - Whether the day is available
   */
  setDay(day: number, val: boolean): void {
    if (val) {
      this.buffer[day] = (1 << this.periodsPerDay) - 1;
    } else {
      this.buffer[day] = 0;
    }
  }

  /**
   * Get availability for a specific time slot
   * @param day - Day index
   * @param period - Period index
   * @returns Whether the slot is available
   */
  get(day: number, period: number): boolean {
    const mask = 1 << period;
    return (this.buffer[day] & mask) != 0;
  }

  /**
   * Print availability to console
   */
  print(): void {
    const maxCellWidth = "Not Available".length;

    for (let dayIdx = 0; dayIdx < this.buffer.length; dayIdx++) {
      let dayAvailability = `Day ${dayIdx + 1}: `;

      for (let periodIdx = 0; periodIdx < this.periodsPerDay; periodIdx++) {
        if (this.get(dayIdx, periodIdx)) {
          dayAvailability += ` ${padRight("Available", maxCellWidth)} |`;
        } else {
          dayAvailability += ` ${padRight("Not Available", maxCellWidth)} |`;
        }
      }
      console.log(dayAvailability.slice(0, -1));
    }
  }

  /**
   * Get all available time slots
   * @returns Array of available slots
   */
  getAvailableSlots(): TimeSlot[] {
    const availableSlots: TimeSlot[] = [];
    for (let day = 0; day < this.days; day++) {
      for (let period = 0; period < this.periodsPerDay; period++) {
        if (this.get(day, period)) {
          availableSlots.push({ day, period });
        }
      }
    }
    return availableSlots;
  }

  /**
   * Toggle availability for a specific time slot
   * @param day - Day index
   * @param period - Period index
   */
  toggle(day: number, period: number): void {
    const mask = 1 << period;
    this.buffer[day] ^= mask;
  }

  /**
   * Custom toJSON to ensure buffer is serialized
   */
  toJSON() {
    return {
      days: this.days,
      periodsPerDay: this.periodsPerDay,
      buffer: this.buffer,
    };
  }
}

/**
 * Class representing a teacher
 */
export class Teacher {
  name: string;
  availability: Availability;

  /**
   * Create a teacher
   * @param name - Teacher's name
   * @param availability - Teacher's availability
   */
  constructor(name: string, availability: Availability) {
    this.name = name;
    this.availability = availability;
  }

  /**
   * Check if teacher is available at a specific time
   * @param day - Day index
   * @param period - Period index
   * @returns Whether the teacher is available
   */
  isAvailable(day: number, period: number): boolean {
    return this.availability.get(day, period);
  }

  /**
   * Get all time slots where the teacher is available
   * @returns Array of available slots
   */
  getAvailableSlots(): TimeSlot[] {
    return this.availability.getAvailableSlots();
  }
}

/**
 * Lesson type supporting normal and alternating lessons
 */
export type Lesson = {
  periodsPerWeek: number;
} & (
  | {
      name: string;
      teacher: Teacher;
      type: "normal";
    }
  | {
      names: [string, string];
      teachers: [Teacher, Teacher];
      type: "alternating";
    }
);

/**
 * Helper functions for Lesson compatibility
 */
export function getLessonName(lesson: Lesson, week: 0 | 1 = 0): string {
  if (lesson.type === "normal") return lesson.name;
  return lesson.names[week];
}

export function getLessonTeacher(lesson: Lesson, week: 0 | 1 = 0): Teacher {
  if (lesson.type === "normal") return lesson.teacher;
  return lesson.teachers[week];
}

export function isAlternatingLesson(
  lesson: Lesson,
): lesson is Extract<Lesson, { type: "alternating" }> {
  return lesson.type === "alternating";
}

/**
 * Class representing a school class
 */
export class Class {
  name: string;
  lessons: Lesson[];

  /**
   * Create a class
   * @param name - Class name
   * @param lessons - Lessons for this class
   */
  constructor(name: string, lessons: Lesson[]) {
    this.name = name;
    this.lessons = lessons;
  }

  /**
   * Get total periods per week for all lessons
   * @returns Total periods per week
   */
  getTotalPeriodsPerWeek(): number {
    return this.lessons.reduce((sum, lesson) => sum + lesson.periodsPerWeek, 0);
  }
}

/**
 * Type for timetable schedule
 */
export type TimetableSchedule = {
  [className: string]: (Lesson | null)[][];
};

/**
 * Class representing a timetable
 */
export class Timetable {
  classes: Class[];
  schedule: TimetableSchedule;

  /**
   * Create a timetable
   * @param classes - Classes to schedule
   */
  constructor(classes: Class[]) {
    this.classes = classes;
    this.schedule = this.createEmptySchedule();
    this.initializeNoGaps();
  }

  /**
   * Create an empty schedule
   * @returns Empty schedule object
   * @private
   */
  private createEmptySchedule(): TimetableSchedule {
    const schedule: TimetableSchedule = {};
    for (const cls of this.classes) {
      schedule[cls.name] = Array.from({ length: DAYS }, () =>
        Array(PERIODS_PER_DAY).fill(null),
      );
    }
    return schedule;
  }

  /**
   * Initialize schedule with no gaps
   * @private
   */
  private initializeNoGaps(): void {
    // HARD RESET: First build a map of which teachers are available when
    const teacherAvailability = new Map<string, boolean[][]>();

    // Initialize availability map for all teachers
    for (const cls of this.classes) {
      for (const lesson of cls.lessons) {
        const teacher = getLessonTeacher(lesson);
        if (!teacherAvailability.has(teacher.name)) {
          // Create a 2D array for this teacher's availability
          const availMatrix: boolean[][] = [];
          for (let day = 0; day < DAYS; day++) {
            availMatrix[day] = [];
            for (let period = 0; period < PERIODS_PER_DAY; period++) {
              // Critical: directly use the teacher's availability
              availMatrix[day][period] = teacher.isAvailable(day, period);
            }
          }
          teacherAvailability.set(teacher.name, availMatrix);
        }
      }
    }

    // Now iterate through each class to assign lessons
    for (const cls of this.classes) {
      const schedule = this.schedule[cls.name];
      const lessonQueue: Lesson[] = [];

      // Collect all lessons that need to be scheduled
      for (const lesson of cls.lessons) {
        for (let i = 0; i < lesson.periodsPerWeek; i++) {
          lessonQueue.push(lesson);
        }
      }

      // Prioritize lessons with most constrained teachers
      lessonQueue.sort((a, b) => {
        // Count the actual number of available slots for each teacher
        const aTeacher = getLessonTeacher(a);
        const bTeacher = getLessonTeacher(b);

        let aAvailableSlots = 0;
        let bAvailableSlots = 0;

        for (let day = 0; day < DAYS; day++) {
          for (let period = 0; period < PERIODS_PER_DAY; period++) {
            if (aTeacher.isAvailable(day, period)) aAvailableSlots++;
            if (bTeacher.isAvailable(day, period)) bAvailableSlots++;
          }
        }

        return aAvailableSlots - bAvailableSlots; // Most constrained first
      });

      let unscheduledLessons: Lesson[] = [];

      // First pass: place lessons in available slots
      for (let i = 0; i < lessonQueue.length; ) {
        const lesson = lessonQueue[i];
        const teacher = getLessonTeacher(lesson);
        let placed = false;

        // Try all possible slots
        for (let day = 0; day < DAYS && !placed; day++) {
          for (let period = 0; period < PERIODS_PER_DAY && !placed; period++) {
            // Skip unavailable slots - CRITICAL CHECK
            if (!teacher.isAvailable(day, period)) continue;

            // Check if the teacher is already scheduled elsewhere at this time
            let teacherBusy = false;
            for (const otherClass of this.classes) {
              if (otherClass.name === cls.name) continue;

              const otherClassSchedule = this.schedule[otherClass.name];
              if (
                otherClassSchedule[day][period] &&
                getLessonTeacher(otherClassSchedule[day][period]!).name ===
                  teacher.name
              ) {
                teacherBusy = true;
                break;
              }
            }

            // If slot is free and teacher isn't busy elsewhere
            if (!teacherBusy && schedule[day][period] === null) {
              schedule[day][period] = lesson;
              placed = true;
              break;
            }
          }
        }

        if (placed) {
          lessonQueue.splice(i, 1); // Remove the placed lesson
        } else {
          // Move to next lesson if we couldn't place this one
          i++;
        }
      }

      // Track any lessons we couldn't schedule
      if (lessonQueue.length > 0) {
        unscheduledLessons = [...lessonQueue];
        console.warn(
          `Class ${cls.name}: Could not schedule some lessons due to constraints:`,
          unscheduledLessons.map(
            l => `${getLessonName(l)} (${getLessonTeacher(l).name})`,
          ),
        );
      }
    }

    // Compact the schedule but never violate teacher availability
    this.compactSchedulePreservingTeacherAvailability();
  }

  /**
   * Compact the schedule while strictly preserving teacher availability
   */
  compactSchedulePreservingTeacherAvailability(): void {
    for (const cls of this.classes) {
      const schedule = this.schedule[cls.name];

      for (let day = 0; day < DAYS; day++) {
        // Collect all lessons for this day
        const lessons: (Lesson | null)[] = [];
        for (let period = 0; period < PERIODS_PER_DAY; period++) {
          if (schedule[day][period] !== null) {
            lessons.push(schedule[day][period]);
          }
        }

        // Clear this day's schedule
        for (let period = 0; period < PERIODS_PER_DAY; period++) {
          schedule[day][period] = null;
        }

        // Reinsert lessons as compactly as possible
        if (lessons.length > 0) {
          let currentPeriod = 0;

          for (const lesson of lessons) {
            if (!lesson) continue;

            // Find next available period where the teacher is available
            let slotFound = false;

            for (
              let period = currentPeriod;
              period < PERIODS_PER_DAY;
              period++
            ) {
              // CRITICAL: Never place in periods where teacher is unavailable
              if (!getLessonTeacher(lesson).isAvailable(day, period)) continue;

              // Check if teacher is busy elsewhere
              let teacherBusy = false;
              for (const otherClass of this.classes) {
                if (otherClass.name === cls.name) continue;

                if (
                  this.schedule[otherClass.name][day][period] &&
                  getLessonTeacher(this.schedule[otherClass.name][day][period]!)
                    .name === getLessonTeacher(lesson).name
                ) {
                  teacherBusy = true;
                  break;
                }
              }

              if (!teacherBusy) {
                schedule[day][period] = lesson;
                currentPeriod = period + 1;
                slotFound = true;
                break;
              }
            }

            // If no slot found on this day, log a warning
            if (!slotFound) {
              console.warn(
                `Cannot compact: No available slot for ${getLessonName(lesson)} (${getLessonTeacher(lesson).name}) on day ${day}`,
              );
            }
          }
        }
      }
    }
  }

  /**
   * Check if a teacher is busy at a specific time
   * @param teacher - The teacher to check
   * @param day - Day index
   * @param period - Period index
   * @param skipClassName - Class name to skip in the check
   * @returns Whether the teacher is busy
   * @private
   */
  private isTeacherBusy(
    teacher: Teacher,
    day: number,
    period: number,
    skipClassName: string,
  ): boolean {
    // PRIORITY CHECK: teacher must be available at this time based on their availability matrix
    // This is a hard constraint that cannot be violated
    if (!teacher.isAvailable(day, period)) {
      return true;
    }

    // Second check: teacher must not be teaching another class at this time
    // This is also a hard constraint that cannot be violated
    for (const cls of this.classes) {
      if (cls.name === skipClassName) continue;
      const lesson = this.schedule[cls.name][day][period];
      if (lesson && getLessonTeacher(lesson).name === teacher.name) {
        return true;
      }
    }

    return false;
  }

  /**
   * Shuffle an array in place
   * @param array - Array to shuffle
   * @private
   */
  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  /**
   * Create a clone of this timetable
   * @returns Cloned timetable
   */
  clone(): Timetable {
    const clone = new Timetable(this.classes);

    for (const cls of this.classes) {
      clone.schedule[cls.name] = Array.from({ length: DAYS }, (_, dayIndex) =>
        Array.from(
          { length: PERIODS_PER_DAY },
          (_, periodIndex) => this.schedule[cls.name][dayIndex][periodIndex],
        ),
      );
    }

    return clone;
  }

  /**
   * Count teacher conflicts in the schedule
   * @returns Number of conflicts
   */
  countTeacherConflicts(): number {
    let conflicts = 0;

    for (let day = 0; day < DAYS; day++) {
      for (let period = 0; period < PERIODS_PER_DAY; period++) {
        const teacherUsage = new Map<string, string[]>();

        // Check all classes and collect teacher usage
        for (const cls of this.classes) {
          const lesson = this.schedule[cls.name][day][period];
          if (!lesson) continue;

          const teacher = getLessonTeacher(lesson);
          const teacherName = teacher.name;

          // First check: Is teacher available at this time?
          if (!teacher.isAvailable(day, period)) {
            console.error(
              `AVAILABILITY CONFLICT: ${teacherName} is scheduled but unavailable on day ${day + 1}, period ${period + 1} for class ${cls.name}`,
            );
            conflicts += 2000; // Reduced penalty for availability violation
          }

          // Track teacher usage for this time slot
          if (!teacherUsage.has(teacherName)) {
            teacherUsage.set(teacherName, [cls.name]);
          } else {
            teacherUsage.get(teacherName)!.push(cls.name);
          }
        }

        // Check for double bookings
        for (const [teacherName, classes] of teacherUsage.entries()) {
          if (classes.length > 1) {
            console.error(
              `DOUBLE BOOKING: ${teacherName} is scheduled for ${classes.length} classes at the same time on day ${day + 1}, period ${period + 1}: ${classes.join(", ")}`,
            );
            conflicts += 10000 * (classes.length - 1); // Extreme penalty for double booking
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * Count unscheduled periods
   * @returns Number of unscheduled periods
   */
  countUnscheduledPeriods(): number {
    let unscheduled = 0;

    for (const cls of this.classes) {
      const requiredPeriods = cls.getTotalPeriodsPerWeek();
      let scheduledPeriods = 0;

      for (let day = 0; day < DAYS; day++) {
        for (let period = 0; period < PERIODS_PER_DAY; period++) {
          if (this.schedule[cls.name][day][period] !== null) {
            scheduledPeriods++;
          }
        }
      }

      unscheduled += requiredPeriods - scheduledPeriods;
    }

    return unscheduled;
  }

  /**
   * Calculate penalty for empty spaces
   * @returns Empty space penalty
   */
  countEmptySpacePenalty(): number {
    let penalty = 0;

    for (const cls of this.classes) {
      const schedule = this.schedule[cls.name];

      for (let day = 0; day < DAYS; day++) {
        let firstLessonPeriod = -1;
        let lastLessonPeriod = -1;

        for (let period = 0; period < PERIODS_PER_DAY; period++) {
          if (schedule[day][period] !== null) {
            if (firstLessonPeriod === -1) {
              firstLessonPeriod = period;
            }
            lastLessonPeriod = period;
          }
        }

        if (firstLessonPeriod !== -1) {
          for (
            let period = firstLessonPeriod;
            period <= lastLessonPeriod;
            period++
          ) {
            if (schedule[day][period] === null) {
              penalty += 1000;
            }
          }
        }
      }
    }

    return penalty;
  }

  /**
   * Identify all conflicts in a timetable
   * @param timetable - The timetable to check
   * @returns Array of conflicts
   */
  identifyConflicts(timetable: Timetable): {
    type: "availability" | "double_booking";
    className: string;
    day: number;
    period: number;
    teacherName: string;
  }[] {
    const conflicts: {
      type: "availability" | "double_booking";
      className: string;
      day: number;
      period: number;
      teacherName: string;
    }[] = [];

    // Track teacher assignments for each time slot
    const teacherAssignments: Map<string, string[]>[][] = Array(DAYS)
      .fill(null)
      .map(() =>
        Array(PERIODS_PER_DAY)
          .fill(null)
          .map(() => new Map<string, string[]>()),
      );

    // First pass: Find and track all potential conflicts
    for (const cls of this.classes) {
      const schedule = timetable.schedule[cls.name];

      for (let day = 0; day < DAYS; day++) {
        for (let period = 0; period < PERIODS_PER_DAY; period++) {
          const lesson = schedule[day][period];

          if (lesson) {
            const teacher = getLessonTeacher(lesson);

            // Check availability conflict
            if (!teacher.isAvailable(day, period)) {
              conflicts.push({
                type: "availability",
                className: cls.name,
                day,
                period,
                teacherName: teacher.name,
              });
            }

            // Check double booking conflict
            if (!teacherAssignments[day][period].has(teacher.name)) {
              teacherAssignments[day][period].set(teacher.name, [cls.name]);
            } else {
              const classes = teacherAssignments[day][period].get(
                teacher.name,
              )!;
              classes.push(cls.name);

              // Only add a conflict for the second and subsequent occurrences
              if (classes.length === 2) {
                conflicts.push({
                  type: "double_booking",
                  className: cls.name,
                  day,
                  period,
                  teacherName: teacher.name,
                });
              }
            }
          }
        }
      }
    }

    // Sort conflicts to prioritize double bookings over availability conflicts
    return conflicts.sort((a, b) => {
      if (a.type === "double_booking" && b.type === "availability") {
        return -1; // Double booking comes first
      } else if (a.type === "availability" && b.type === "double_booking") {
        return 1; // Availability conflict comes second
      }
      return 0;
    });
  }

  /**
   * Resolve a specific conflict
   * @param timetable - The timetable to modify
   * @param conflict - The conflict to resolve
   * @returns Whether the conflict was successfully resolved
   */
  resolveConflict(
    timetable: Timetable,
    conflict: {
      type: "availability" | "double_booking";
      className: string;
      day: number;
      period: number;
      teacherName: string;
    },
  ): boolean {
    const { className, day, period, type } = conflict;
    const lesson = timetable.schedule[className][day][period];

    if (!lesson) return false; // Safety check

    console.warn(
      `Resolving ${type} conflict for ${getLessonName(lesson)} (${getLessonTeacher(lesson).name}) in class ${className}, day ${day}, period ${period}`,
    );

    // For availability conflicts, we must move the lesson since the teacher is not available at this time
    if (type === "availability") {
      // Step 1: Try to find another valid time slot for this lesson
      if (this.moveLessonToValidSlot(timetable, className, day, period)) {
        return true;
      }

      // Step 2: If direct move failed, try swapping with another lesson
      if (this.swapWithCompatibleLesson(timetable, className, day, period)) {
        return true;
      }

      // Step 3: Try to find an alternate teacher for this subject
      if (this.findAlternateTeacher(timetable, className, day, period)) {
        return true;
      }

      // Step 4: Rebuild the class schedule as a last resort before removing
      if (this.rebuildClassSchedule(timetable, className)) {
        // Check if the specific conflict was resolved
        const lessonAfterRebuild = timetable.schedule[className][day][period];
        if (
          !lessonAfterRebuild ||
          getLessonTeacher(lessonAfterRebuild).name !== conflict.teacherName ||
          getLessonTeacher(lessonAfterRebuild).isAvailable(day, period)
        ) {
          return true;
        }
      }

      // Step 5: Remove the lesson if we can't resolve the conflict
      // It's better to have an unscheduled lesson than to violate teacher availability
      console.error(
        `Could not resolve availability conflict. Removing lesson ${getLessonName(lesson)} from class ${className}`,
      );
      timetable.schedule[className][day][period] = null;
      return true;
    }

    // For double booking conflicts, we can try more options
    // Step 1: Try to find another valid time slot for this lesson
    if (this.moveLessonToValidSlot(timetable, className, day, period)) {
      return true;
    }

    // Step 2: If direct move failed, try swapping with another lesson
    if (this.swapWithCompatibleLesson(timetable, className, day, period)) {
      return true;
    }

    // Step 3: Try to find an alternate teacher for this subject
    if (this.findAlternateTeacher(timetable, className, day, period)) {
      return true;
    }

    // Step 4: If all else fails, try rebuilding the schedule for this class
    const rebuildSuccessful = this.rebuildClassSchedule(timetable, className);

    // If rebuilding failed, remove the lesson as a last resort
    if (!rebuildSuccessful) {
      console.error(
        `Could not resolve double booking conflict. Removing lesson ${getLessonName(lesson)} from class ${className}`,
      );
      timetable.schedule[className][day][period] = null;
    }

    return true;
  }

  /**
   * Try to find an alternate teacher who can teach the same subject
   * @param timetable - The timetable to modify
   * @param className - The class name
   * @param day - Current day of the lesson
   * @param period - Current period of the lesson
   * @returns Whether the substitution was successful
   */
  findAlternateTeacher(
    timetable: Timetable,
    className: string,
    day: number,
    period: number,
  ): boolean {
    const lesson = timetable.schedule[className][day][period];
    if (!lesson) return false;

    const currentTeacher = getLessonTeacher(lesson);
    const lessonName = getLessonName(lesson);

    // Find all teachers who teach this subject
    const potentialTeachers: Teacher[] = [];

    // Check all classes and lessons to find teachers who teach this subject
    for (const cls of this.classes) {
      for (const clsLesson of cls.lessons) {
        if (
          getLessonName(clsLesson) === lessonName &&
          getLessonTeacher(clsLesson).name !== currentTeacher.name &&
          !potentialTeachers.some(
            t => t.name === getLessonTeacher(clsLesson).name,
          )
        ) {
          potentialTeachers.push(getLessonTeacher(clsLesson));
        }
      }
    }

    // Find a teacher who is available and not busy at this time
    for (const teacher of potentialTeachers) {
      if (
        teacher.isAvailable(day, period) &&
        !this.isTeacherBusy(teacher, day, period, className)
      ) {
        // Create a new lesson with this teacher
        const newLesson = {
          name: lessonName,
          teacher,
          periodsPerWeek: lesson.periodsPerWeek,
          type: "normal" as const,
        };
        timetable.schedule[className][day][period] = newLesson;
        console.log(
          `Substituted teacher ${currentTeacher.name} with ${teacher.name} for ${lessonName} in class ${className}`,
        );
        return true;
      }
    }

    return false;
  }

  /**
   * Rebuild the entire schedule for a class to resolve conflicts
   * @param timetable - The timetable to modify
   * @param className - The class to rebuild
   * @returns Whether the rebuild was successful
   */
  rebuildClassSchedule(timetable: Timetable, className: string): boolean {
    const classObj = this.classes.find(c => c.name === className);
    if (!classObj) return false;

    // Clear the schedule for this class
    for (let day = 0; day < DAYS; day++) {
      for (let period = 0; period < PERIODS_PER_DAY; period++) {
        timetable.schedule[className][day][period] = null;
      }
    }

    // Collect all lessons needed to schedule
    const lessonQueue: Lesson[] = [];
    for (const lesson of classObj.lessons) {
      for (let i = 0; i < lesson.periodsPerWeek; i++) {
        lessonQueue.push(lesson);
      }
    }

    // Prioritize lessons by teacher availability (most constrained first)
    lessonQueue.sort((a, b) => {
      const aSlots = getLessonTeacher(a).getAvailableSlots().length;
      const bSlots = getLessonTeacher(b).getAvailableSlots().length;
      return aSlots - bSlots;
    });

    // Try to place each lesson in a valid slot
    let placedCount = 0;

    for (const lesson of lessonQueue) {
      const teacher = getLessonTeacher(lesson);
      let placed = false;

      // Get all valid slots for this teacher
      const validSlots: { day: number; period: number; score: number }[] = [];

      for (let day = 0; day < DAYS; day++) {
        for (let period = 0; period < PERIODS_PER_DAY; period++) {
          if (
            timetable.schedule[className][day][period] === null &&
            teacher.isAvailable(day, period) &&
            !this.isTeacherBusy(teacher, day, period, className)
          ) {
            validSlots.push({ day, period, score: 10 });
          }
        }
      }

      // Shuffle to prevent biased placement
      this.shuffleArray(validSlots);

      // Try to place in a valid slot
      for (const slot of validSlots) {
        timetable.schedule[className][slot.day][slot.period] = lesson;
        placed = true;
        placedCount++;
        break;
      }

      // If no valid slot, try any available slot as a last resort
      if (!placed) {
        for (let day = 0; day < DAYS && !placed; day++) {
          for (let period = 0; period < PERIODS_PER_DAY && !placed; period++) {
            if (timetable.schedule[className][day][period] === null) {
              timetable.schedule[className][day][period] = lesson;
              placed = true;
              placedCount++;
              break;
            }
          }
          if (placed) break;
        }
      }
    }

    // Make sure we don't have gaps
    timetable.compactSchedule();

    // Return true if we placed all or most of the lessons
    return placedCount === lessonQueue.length;
  }

  /**
   * Perform a random mutation to try to improve the timetable
   * @param clone - The timetable to mutate
   * @returns The mutated timetable
   */
  performRandomMutation(clone: Timetable): Timetable {
    const mutationType = Math.random();

    // Choose a random class for mutation
    const randomClassIndex = Math.floor(Math.random() * this.classes.length);
    const randomClass = this.classes[randomClassIndex];

    if (mutationType < 0.4) {
      // Swap two random periods within the same day for a class
      this.swapRandomPeriodsInSameDay(clone, randomClass);
    } else if (mutationType < 0.8) {
      // Swap lessons between two different days
      this.swapLessonsBetweenDays(clone, randomClass);
    } else {
      // Shuffle all lessons in a day
      this.shuffleDayLessons(clone, randomClass);
    }

    // Ensure no gaps after mutation
    clone.compactSchedule();

    return clone;
  }

  /**
   * Swap two random periods within the same day
   * @param timetable - The timetable to modify
   * @param randomClass - The class to modify
   */
  swapRandomPeriodsInSameDay(timetable: Timetable, randomClass: Class): void {
    const schedule = timetable.schedule[randomClass.name];
    const randomDay = Math.floor(Math.random() * DAYS);

    // Find periods that have lessons
    const periodsWithLessons: number[] = [];
    for (let period = 0; period < PERIODS_PER_DAY; period++) {
      if (schedule[randomDay][period] !== null) {
        periodsWithLessons.push(period);
      }
    }

    if (periodsWithLessons.length >= 2) {
      // Pick two random periods to swap
      this.shuffleArray(periodsWithLessons);
      const period1 = periodsWithLessons[0];
      const period2 = periodsWithLessons[1];

      // Swap the lessons
      [schedule[randomDay][period1], schedule[randomDay][period2]] = [
        schedule[randomDay][period2],
        schedule[randomDay][period1],
      ];
    }
  }

  /**
   * Swap lessons between two different days
   * @param timetable - The timetable to modify
   * @param randomClass - The class to modify
   */
  swapLessonsBetweenDays(timetable: Timetable, randomClass: Class): void {
    const schedule = timetable.schedule[randomClass.name];

    // Select two different random days
    const day1 = Math.floor(Math.random() * DAYS);
    let day2 = Math.floor(Math.random() * DAYS);
    if (day1 === day2) day2 = (day2 + 1) % DAYS;

    // Find periods with lessons on both days
    const periods1: number[] = [];
    const periods2: number[] = [];

    for (let p = 0; p < PERIODS_PER_DAY; p++) {
      if (schedule[day1][p] !== null) {
        periods1.push(p);
      }
      if (schedule[day2][p] !== null) {
        periods2.push(p);
      }
    }

    if (periods1.length > 0 && periods2.length > 0) {
      const period1 = periods1[Math.floor(Math.random() * periods1.length)];
      const period2 = periods2[Math.floor(Math.random() * periods2.length)];

      const lesson1 = schedule[day1][period1];
      const lesson2 = schedule[day2][period2];

      // Check that the swap doesn't create new conflicts
      if (lesson1 && lesson2) {
        const teacher1 = getLessonTeacher(lesson1);
        const teacher2 = getLessonTeacher(lesson2);

        const teacher1CanSwap =
          teacher1.isAvailable(day2, period2) &&
          !this.isTeacherBusy(teacher1, day2, period2, randomClass.name);

        const teacher2CanSwap =
          teacher2.isAvailable(day1, period1) &&
          !this.isTeacherBusy(teacher2, day1, period1, randomClass.name);

        // Only swap if it doesn't create new conflicts
        if (teacher1CanSwap && teacher2CanSwap) {
          // Swap the lessons
          [schedule[day1][period1], schedule[day2][period2]] = [
            schedule[day2][period2],
            schedule[day1][period1],
          ];
        }
      }
    }
  }

  /**
   * Shuffle all lessons in a day
   * @param timetable - The timetable to modify
   * @param randomClass - The class to modify
   */
  shuffleDayLessons(timetable: Timetable, randomClass: Class): void {
    const schedule = timetable.schedule[randomClass.name];
    const randomDay = Math.floor(Math.random() * DAYS);

    // Collect all lessons for this day
    const lessons: (Lesson | null)[] = [];
    for (let period = 0; period < PERIODS_PER_DAY; period++) {
      lessons.push(schedule[randomDay][period]);
    }

    // Shuffle the lessons
    this.shuffleArray(lessons);

    // Put them back
    for (let period = 0; period < PERIODS_PER_DAY; period++) {
      schedule[randomDay][period] = lessons[period];
    }
  }

  /**
   * Print the timetable to console
   */
  print(): void {
    const isValid = this.validateNoGaps();
    if (!isValid) {
      console.error("WARNING: TIMETABLE CONTAINS GAPS!");
    }

    const maxLessonNameLength = Math.max(
      ...this.classes.map(cls =>
        Math.max(
          ...cls.lessons.map(lesson => getLessonName(lesson).length),
          "Free".length,
        ),
      ),
    );
    const maxTeacherNameLength = Math.max(
      ...this.classes.map(cls =>
        Math.max(
          ...cls.lessons.map(lesson => getLessonTeacher(lesson).name.length),
          0,
        ),
      ),
    );
    const maxCellWidth = maxLessonNameLength + maxTeacherNameLength + 3;

    for (const cls of this.classes) {
      console.log(`Class ${cls.name}:`);
      const schedule = this.schedule[cls.name];

      let headerRow = "        ";
      for (let period = 0; period < PERIODS_PER_DAY; period++) {
        headerRow += ` ${padRight(`Period ${period + 1}`, maxCellWidth)} |`;
      }
      console.log(headerRow.slice(0, -1));
      console.log("-".repeat(headerRow.length - 1));

      for (let day = 0; day < DAYS; day++) {
        let daySchedule = `Day ${day + 1}: `;

        let lessonCount = 0;
        for (let period = 0; period < PERIODS_PER_DAY; period++) {
          if (schedule[day][period] !== null) {
            lessonCount++;
          }
        }

        for (let period = 0; period < PERIODS_PER_DAY; period++) {
          const lesson = schedule[day][period];
          const isGap = lesson === null && period < lessonCount;

          if (lesson) {
            const lessonStr = `${getLessonName(lesson)} (${getLessonTeacher(lesson).name})`;
            daySchedule += ` ${padRight(lessonStr, maxCellWidth)} |`;
          } else {
            if (isGap) {
              daySchedule += ` ${padRight("GAP ERROR", maxCellWidth)} |`;
            } else {
              daySchedule += ` ${padRight("Free", maxCellWidth)} |`;
            }
          }
        }

        console.log(daySchedule.slice(0, -1));
      }

      console.log("");
    }

    const conflicts = this.countTeacherConflicts();
    const unscheduled = this.countUnscheduledPeriods();
    const emptySpaces = this.countEmptySpacePenalty();

    console.log("Schedule Quality Metrics:");
    console.log(`- Teacher conflicts: ${conflicts}`);
    console.log(`- Unscheduled periods: ${unscheduled}`);
    console.log(
      `- Empty space penalties: ${emptySpaces > 0 ? "ERROR: " + emptySpaces : 0}`,
    );
    console.log(`- Total penalties: ${conflicts + unscheduled + emptySpaces}`);
    if (emptySpaces > 0) {
      console.error("ERROR: SCHEDULE CONTAINS GAPS BETWEEN LESSONS!");
    } else {
      console.log("✓ No gaps in class schedules");
    }
    console.log("");
  }

  /**
   * Validate that the schedule has no gaps
   * @returns Whether the schedule is valid
   */
  validateNoGaps(): boolean {
    let hasGaps = false;

    for (const cls of this.classes) {
      const schedule = this.schedule[cls.name];

      for (let day = 0; day < DAYS; day++) {
        let firstNull = -1;
        let lessonAfterNull = false;

        for (let period = 0; period < PERIODS_PER_DAY; period++) {
          if (schedule[day][period] === null) {
            if (firstNull === -1) {
              firstNull = period;
            }
          } else if (firstNull !== -1) {
            lessonAfterNull = true;
            break;
          }
        }

        if (firstNull !== -1 && lessonAfterNull) {
          console.error(
            `FOUND GAP in Class ${cls.name}, Day ${day + 1}: lesson after period ${firstNull}`,
          );
          hasGaps = true;
        }
      }
    }

    return !hasGaps;
  }

  /**
   * Generate HTML for timetable export
   * @returns HTML string representation of the timetable
   */
  generateHtml(): string {
    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    let html = `
      <html>
      <head>
        <title>School Timetable</title>
        <style>
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            margin: 20px; 
            background-color: #18181b; 
            color: #e2e8f0; 
          }
          h1 { 
            color: #60a5fa; 
            font-weight: 600;
            background: linear-gradient(to right, #60a5fa, #a78bfa);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 30px;
          }
          h2 { 
            color: #93c5fd; 
            margin-top: 32px;
            font-weight: 500;
          }
          table { 
            border-collapse: collapse; 
            width: 100%; 
            margin-bottom: 24px; 
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(96, 165, 250, 0.15);
            background: #27272a;
          }
          th, td { 
            border: 1px solid #3f3f46; 
            text-align: left; 
            padding: 12px; 
          }
          th { 
            background: linear-gradient(to right, #27272a, #232329);
            color: #93c5fd;
            font-weight: 500;
          }
          td {
            background-color: #2d2d33;
          }
          tr:hover td { 
            background-color: #323238; 
            transition: background-color 0.3s ease;
          }
          .free { 
            color: #6b7280; 
            font-style: italic;
          }
          .metrics { 
            margin-top: 40px; 
            border-top: 1px solid #3f3f46; 
            padding-top: 24px; 
            background-color: #18181b; 
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(96, 165, 250, 0.1);
          }
          .error { 
            color: #ef4444; 
            font-weight: 600; 
          }
          .teacher {
            color: #a78bfa;
            font-size: 0.9em;
            margin-top: 4px;
          }
          .lesson {
            font-weight: 500;
            color: #f1f5f9;
          }
        </style>
      </head>
      <body>
        <h1>School Timetable</h1>
    `;

    for (const cls of this.classes) {
      html += `<h2>Class ${cls.name}</h2>`;
      html += "<table><tr><th></th>";

      // Display days as column headers
      for (let day = 0; day < DAYS; day++) {
        html += `<th>${dayNames[day]}</th>`;
      }
      html += "</tr>";

      const schedule = this.schedule[cls.name];

      // Display periods as row headers
      for (let period = 0; period < PERIODS_PER_DAY; period++) {
        html += `<tr><th>Period ${period + 1}</th>`;

        for (let day = 0; day < DAYS; day++) {
          const lesson = schedule[day][period];
          if (lesson) {
            html += `<td><div class="lesson">${getLessonName(lesson)}</div><div class="teacher">${getLessonTeacher(lesson).name}</div></td>`;
          } else {
            html += '<td class="free">Free</td>';
          }
        }

        html += "</tr>";
      }

      html += "</table>";
    }

    const conflicts = this.countTeacherConflicts();
    const unscheduled = this.countUnscheduledPeriods();
    const emptySpaces = this.countEmptySpacePenalty();

    html += `
      <div class="metrics">
        <h2>Schedule Quality Metrics</h2>
        <p>• Teacher conflicts: ${conflicts}</p>
        <p>• Unscheduled periods: ${unscheduled}</p>
        <p class="${emptySpaces > 0 ? "error" : ""}">• Empty space penalties: ${emptySpaces > 0 ? "ERROR: " + emptySpaces : "0"}</p>
        <p>• Total penalties: ${conflicts + unscheduled + emptySpaces}</p>
        ${
          emptySpaces > 0
            ? '<p class="error">ERROR: SCHEDULE CONTAINS GAPS BETWEEN LESSONS!</p>'
            : "<p style='color: #10b981'>✓ No gaps in class schedules</p>"
        }
      </div>
    `;

    html += "</body></html>";

    return html;
  }

  /**
   * Export the timetable to a PDF file
   * @param filename - Output filename
   * @returns Promise resolving to the filename
   */
  exportToPDF(filename = "timetable.pdf"): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // Generate HTML for the PDF
        const html = this.generateHtml();

        // Create a new window with the HTML content
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
          throw new Error(
            "Could not open print window. Please check your popup blocker settings.",
          );
        }

        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>School Timetable</title>
              <style>
                @media print {
                  body { 
                    font-family: 'Segoe UI', Arial, sans-serif; 
                    margin: 20px; 
                    background-color: #18181b; 
                    color: #e2e8f0; 
                  }
                  h1 { 
                    color: #60a5fa; 
                    font-weight: 600;
                    background: linear-gradient(to right, #60a5fa, #a78bfa);
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                    margin-bottom: 30px;
                  }
                  h2 { 
                    color: #93c5fd; 
                    margin-top: 32px;
                    font-weight: 500;
                  }
                  table { 
                    border-collapse: collapse; 
                    width: 100%; 
                    margin-bottom: 24px; 
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 4px 12px rgba(96, 165, 250, 0.15);
                    background: #27272a;
                  }
                  th, td { 
                    border: 1px solid #3f3f46; 
                    text-align: left; 
                    padding: 12px; 
                  }
                  th { 
                    background: linear-gradient(to right, #27272a, #232329);
                    color: #93c5fd;
                    font-weight: 500;
                  }
                  td {
                    background-color: #2d2d33;
                  }
                  .free { 
                    color: #6b7280; 
                    font-style: italic;
                  }
                  .metrics { 
                    margin-top: 40px; 
                    border-top: 1px solid #3f3f46; 
                    padding-top: 24px; 
                    background-color: #18181b; 
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(96, 165, 250, 0.1);
                  }
                  .error { 
                    color: #ef4444; 
                    font-weight: 600; 
                  }
                  .teacher {
                    color: #a78bfa;
                    font-size: 0.9em;
                    margin-top: 4px;
                  }
                  .lesson {
                    font-weight: 500;
                    color: #f1f5f9;
                  }
                  @page { 
                    size: landscape; 
                  }
                  .class-section { 
                    page-break-after: always; 
                  }
                  .class-section:last-child { 
                    page-break-after: avoid; 
                  }
                }
                
                /* Regular styles - for preview */
                body { 
                  font-family: 'Segoe UI', Arial, sans-serif; 
                  margin: 20px; 
                  background-color: #18181b; 
                  color: #e2e8f0; 
                }
                h1 { 
                  color: #60a5fa; 
                  font-weight: 600;
                  background: linear-gradient(to right, #60a5fa, #a78bfa);
                  -webkit-background-clip: text;
                  background-clip: text;
                  -webkit-text-fill-color: transparent;
                  margin-bottom: 30px;
                }
                h2 { 
                  color: #93c5fd; 
                  margin-top: 32px;
                  font-weight: 500;
                }
                table { 
                  border-collapse: collapse; 
                  width: 100%; 
                  margin-bottom: 24px; 
                  border-radius: 8px;
                  overflow: hidden;
                  box-shadow: 0 4px 12px rgba(96, 165, 250, 0.15);
                  background: #27272a;
                }
                th, td { 
                  border: 1px solid #3f3f46; 
                  text-align: left; 
                  padding: 12px; 
                }
                th { 
                  background: linear-gradient(to right, #27272a, #232329);
                  color: #93c5fd;
                  font-weight: 500;
                }
                td {
                  background-color: #2d2d33;
                }
                .free { 
                  color: #6b7280; 
                  font-style: italic;
                }
                .metrics { 
                  margin-top: 40px; 
                  border-top: 1px solid #3f3f46; 
                  padding-top: 24px; 
                  background-color: #18181b; 
                  padding: 20px;
                  border-radius: 8px;
                  box-shadow: 0 4px 12px rgba(96, 165, 250, 0.1);
                }
                .error { 
                  color: #ef4444; 
                  font-weight: 600; 
                }
                .teacher {
                  color: #a78bfa;
                  font-size: 0.9em;
                  margin-top: 4px;
                }
                .lesson {
                  font-weight: 500;
                  color: #f1f5f9;
                }
                .class-section { 
                  page-break-after: always; 
                }
                .class-section:last-child { 
                  page-break-after: avoid; 
                }
                @page { 
                  size: landscape; 
                }
              </style>
            </head>
            <body>
              ${html}
              <script>
                window.onload = function() {
                  setTimeout(function() {
                    window.print();
                    setTimeout(function() {
                      window.close();
                    }, 500);
                  }, 250);
                };
              </script>
            </body>
          </html>
        `);

        printWindow.document.close();
        resolve(filename);
      } catch (error) {
        console.error("Error exporting to PDF:", error);
        reject(error);
      }
    });
  }

  /**
   * Generate HTML for teacher timetables
   * @returns HTML string representation of the teacher timetables
   */
  generateTeacherTimetablesHtml(): string {
    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const teacherSchedules = new Map<
      string,
      Map<number, Map<number, { class: string; lessonName: string }>>
    >();

    // Collect all lessons for each teacher
    for (const cls of this.classes) {
      const className = cls.name;
      for (let day = 0; day < DAYS; day++) {
        for (let period = 0; period < PERIODS_PER_DAY; period++) {
          const lesson = this.schedule[className][day][period];
          if (lesson) {
            const teacherName = getLessonTeacher(lesson).name;

            // Initialize teacher schedule
            if (!teacherSchedules.has(teacherName)) {
              teacherSchedules.set(teacherName, new Map());
            }

            const teacherSchedule = teacherSchedules.get(teacherName)!;

            // Initialize day
            if (!teacherSchedule.has(day)) {
              teacherSchedule.set(day, new Map());
            }

            const daySchedule = teacherSchedule.get(day)!;

            // Save the lesson for this period
            daySchedule.set(period, {
              class: className,
              lessonName: getLessonName(lesson),
            });
          }
        }
      }
    }

    // Generate HTML for each teacher
    let html = `
      <html>
      <head>
        <title>Teacher Timetables</title>
        <style>
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            margin: 20px; 
            background-color: #18181b; 
            color: #e2e8f0; 
          }
          h1 { 
            color: #60a5fa; 
            font-weight: 600;
            background: linear-gradient(to right, #60a5fa, #a78bfa);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 30px;
          }
          h2 { 
            color: #93c5fd; 
            margin-top: 32px;
            font-weight: 500;
            padding-left: 8px;
            border-left: 4px solid #818cf8;
          }
          table { 
            border-collapse: collapse; 
            width: 100%; 
            margin-bottom: 24px; 
            page-break-inside: avoid;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(96, 165, 250, 0.15);
            background: #27272a;
          }
          th, td { 
            border: 1px solid #3f3f46; 
            text-align: left; 
            padding: 12px; 
          }
          th { 
            background: linear-gradient(to right, #27272a, #232329);
            color: #93c5fd;
            font-weight: 500;
          }
          td {
            background-color: #2d2d33;
          }
          .free { 
            color:rgb(0, 171, 0); 
            font-style: italic;
          }
          .unavailable {
            background-color:rgb(255, 233, 224);
            color:rgb(255, 0, 0);
            font-style: italic;
            font-weight: 900;
          }
          .teacher-section { 
            page-break-after: always; 
            margin-bottom: 40px;
            padding: 20px;
            border-radius: 8px;
            background-color: #1f1f23;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          }
          .teacher-section:last-child { 
            page-break-after: avoid; 
          }
          .class-name {
            color: #a78bfa;
            font-size: 0.9em;
            margin-top: 4px;
          }
          .subject-name {
            font-weight: 500;
            color: #f1f5f9;
          }
          @page { 
            size: landscape; 
          }
        </style>
      </head>
      <body>
        <h1>Teacher Timetables</h1>
    `;

    // Sort teachers alphabetically
    const sortedTeachers = Array.from(teacherSchedules.keys()).sort();

    for (const teacherName of sortedTeachers) {
      const teacherSchedule = teacherSchedules.get(teacherName)!;

      // Find the teacher object to check availability
      const teacher = this.classes
        .flatMap(cls => cls.lessons.map(l => getLessonTeacher(l)))
        .find(t => t.name === teacherName);

      if (!teacher) continue;

      html += `<div class="teacher-section"><h2>Teacher: ${teacherName}</h2>`;
      html += "<table><tr><th></th>";

      // Display days as column headers
      for (let day = 0; day < DAYS; day++) {
        html += `<th>${dayNames[day]}</th>`;
      }
      html += "</tr>";

      // Display periods as row headers
      for (let period = 0; period < PERIODS_PER_DAY; period++) {
        html += `<tr><th>Period ${period + 1}</th>`;

        for (let day = 0; day < DAYS; day++) {
          const daySchedule = teacherSchedule.get(day);
          const lesson = daySchedule?.get(period);

          if (lesson) {
            html += `<td><div class="subject-name">${lesson.lessonName}</div><div class="class-name">Class ${lesson.class}</div></td>`;
          } else if (teacher && !teacher.isAvailable(day, period)) {
            // Teacher is unavailable during this period
            html += '<td class="unavailable">Indisponibil</td>';
          } else {
            html += '<td class="free">Liber</td>';
          }
        }

        html += "</tr>";
      }

      html += "</table></div>";
    }

    html += "</body></html>";

    return html;
  }

  /**
   * Export teacher timetables to a PDF file
   * @param filename - Output filename
   * @returns Promise resolving to the filename
   */
  exportTeacherTimetablesToPDF(
    filename = "teacher-timetables.pdf",
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // Generate HTML for the PDF
        const html = this.generateTeacherTimetablesHtml();

        // Create a new window with the HTML content
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
          throw new Error(
            "Could not open print window. Please check your popup blocker settings.",
          );
        }

        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Teacher Timetables</title>
              <style>
                @media print {
                  body { 
                    font-family: 'Segoe UI', Arial, sans-serif; 
                    margin: 20px; 
                    background-color: #18181b; 
                    color: #e2e8f0; 
                  }
                  h1 { 
                    color: #60a5fa; 
                    font-weight: 600;
                    background: linear-gradient(to right, #60a5fa, #a78bfa);
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                    margin-bottom: 30px;
                  }
                  h2 { 
                    color: #93c5fd; 
                    margin-top: 32px;
                    font-weight: 500;
                    padding-left: 8px;
                    border-left: 4px solid #818cf8;
                  }
                  table { 
                    border-collapse: collapse; 
                    width: 100%; 
                    margin-bottom: 24px; 
                    page-break-inside: avoid;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 4px 12px rgba(96, 165, 250, 0.15);
                    background: #27272a;
                  }
                  th, td { 
                    border: 1px solid #3f3f46; 
                    text-align: left; 
                    padding: 12px; 
                  }
                  th { 
                    background: linear-gradient(to right, #27272a, #232329);
                    color: #93c5fd;
                    font-weight: 500;
                  }
                  td {
                    background-color: #2d2d33;
                  }
                  .free { 
                    color: #6b7280; 
                    font-style: italic;
                  }
                  .unavailable {
                    background-color: #c2410c;
                    color: #f1f5f9;
                    font-style: italic;
                  }
                  .teacher-section { 
                    page-break-after: always; 
                    margin-bottom: 40px;
                    padding: 20px;
                    border-radius: 8px;
                    background-color: #1f1f23;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                  }
                  .teacher-section:last-child { 
                    page-break-after: avoid; 
                  }
                  .class-name {
                    color: #a78bfa;
                    font-size: 0.9em;
                    margin-top: 4px;
                  }
                  .subject-name {
                    font-weight: 500;
                    color: #f1f5f9;
                  }
                  @page { 
                    size: landscape; 
                  }
                }
                
                /* Regular styles - for preview */
                body { 
                  font-family: 'Segoe UI', Arial, sans-serif; 
                  margin: 20px; 
                  background-color: #18181b; 
                  color: #e2e8f0; 
                }
                h1 { 
                  color: #60a5fa; 
                  font-weight: 600;
                  background: linear-gradient(to right, #60a5fa, #a78bfa);
                  -webkit-background-clip: text;
                  background-clip: text;
                  -webkit-text-fill-color: transparent;
                  margin-bottom: 30px;
                }
                h2 { 
                  color: #93c5fd; 
                  margin-top: 32px;
                  font-weight: 500;
                  padding-left: 8px;
                  border-left: 4px solid #818cf8;
                }
                table { 
                  border-collapse: collapse; 
                  width: 100%; 
                  margin-bottom: 24px; 
                  border-radius: 8px;
                  overflow: hidden;
                  box-shadow: 0 4px 12px rgba(96, 165, 250, 0.15);
                  background: #27272a;
                }
                th, td { 
                  border: 1px solid #3f3f46; 
                  text-align: left; 
                  padding: 12px; 
                }
                th { 
                  background: linear-gradient(to right, #27272a, #232329);
                  color: #93c5fd;
                  font-weight: 500;
                }
                td {
                  background-color: #2d2d33;
                }
                .free { 
                  color: #6b7280; 
                  font-style: italic;
                }
                .teacher-section { 
                  page-break-after: always; 
                  margin-bottom: 40px;
                  padding: 20px;
                  border-radius: 8px;
                  background-color: #1f1f23;
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                }
                .teacher-section:last-child { 
                  page-break-after: avoid; 
                }
                .class-name {
                  color: #a78bfa;
                  font-size: 0.9em;
                  margin-top: 4px;
                }
                .subject-name {
                  font-weight: 500;
                  color: #f1f5f9;
                }
                @page { 
                  size: landscape; 
                }
              </style>
            </head>
            <body>
              ${html}
              <script>
                window.onload = function() {
                  setTimeout(function() {
                    window.print();
                    setTimeout(function() {
                      window.close();
                    }, 500);
                  }, 250);
                };
              </script>
            </body>
          </html>
        `);

        printWindow.document.close();
        resolve(filename);
      } catch (error) {
        console.error("Error exporting teacher timetables to PDF:", error);
        reject(error);
      }
    });
  }

  /**
   * Count the number of free first periods (soft constraint)
   * @returns Number of free first periods
   */
  countFreeFirstPeriods(): number {
    let count = 0;
    for (const cls of this.classes) {
      const schedule = this.schedule[cls.name];
      for (let day = 0; day < DAYS; day++) {
        if (schedule[day][0] === null) {
          count++;
        }
      }
    }
    return count;
  }

  /**
   * Create a mutated copy of this timetable
   * @returns Mutated timetable
   */
  mutate(): Timetable {
    const clone = this.clone();

    // Mutation strategy priority:
    // 1. Resolve teacher conflicts (availability and double booking)
    // 2. Resolve gaps in schedules
    // 3. Try random improvements

    // First identify all conflicts in the timetable
    const conflicts = this.identifyConflicts(clone);

    if (conflicts.length > 0) {
      // Randomly select one conflict to resolve
      const randomIndex = Math.floor(Math.random() * conflicts.length);
      const conflict = conflicts[randomIndex];

      // Try to resolve the selected conflict
      if (this.resolveConflict(clone, conflict)) {
        return clone;
      }
    }

    // If no conflicts, or couldn't resolve the selected conflict,
    // perform a random mutation to try to improve the schedule
    return this.performRandomMutation(clone);
  }

  /**
   * Move a lesson to a valid time slot
   * @param timetable - The timetable to modify
   * @param className - The class name
   * @param day - Current day of the lesson
   * @param period - Current period of the lesson
   * @returns Whether the move was successful
   */
  moveLessonToValidSlot(
    timetable: Timetable,
    className: string,
    day: number,
    period: number,
  ): boolean {
    const lesson = timetable.schedule[className][day][period];
    if (!lesson) return false;

    const teacher = getLessonTeacher(lesson);

    // Create a list of all possible slots sorted by preference:
    // 1. Same day, different period (to minimize disruption)
    // 2. Different day, any period
    const candidateSlots: { day: number; period: number; score: number }[] = [];

    // First check all periods on the same day
    for (let p = 0; p < PERIODS_PER_DAY; p++) {
      if (
        p !== period &&
        timetable.schedule[className][day][p] === null &&
        teacher.isAvailable(day, p) &&
        !this.isTeacherBusy(teacher, day, p, className)
      ) {
        // Higher score for same day slots
        candidateSlots.push({ day, period: p, score: 10 });
      }
    }

    // Then check other days
    for (let d = 0; d < DAYS; d++) {
      if (d === day) continue;

      for (let p = 0; p < PERIODS_PER_DAY; p++) {
        if (
          timetable.schedule[className][d][p] === null &&
          teacher.isAvailable(d, p) &&
          !this.isTeacherBusy(teacher, d, p, className)
        ) {
          // Score based on how far from original day (closer is better)
          const dayDistance = Math.abs(d - day);
          candidateSlots.push({ day: d, period: p, score: 9 - dayDistance });
        }
      }
    }

    // Sort slots by score (highest first)
    candidateSlots.sort((a, b) => b.score - a.score);

    // Try the best slot
    if (candidateSlots.length > 0) {
      const bestSlot = candidateSlots[0];

      // Move the lesson
      timetable.schedule[className][bestSlot.day][bestSlot.period] = lesson;
      timetable.schedule[className][day][period] = null;

      // Compact to avoid gaps
      timetable.compactSchedule();
      return true;
    }

    return false;
  }

  /**
   * Try to swap with another compatible lesson
   * @param timetable - The timetable to modify
   * @param className - The class name
   * @param day - Day index
   * @param period - Period index
   * @returns Whether the swap was successful
   */
  swapWithCompatibleLesson(
    timetable: Timetable,
    className: string,
    day: number,
    period: number,
  ): boolean {
    const lesson = timetable.schedule[className][day][period];
    if (!lesson) return false;

    const teacher = getLessonTeacher(lesson);

    // Find potential swap candidates in the same class
    type SwapCandidate = {
      day: number;
      period: number;
      lesson: Lesson;
      score: number;
    };

    const swapCandidates: SwapCandidate[] = [];

    // Check all other lessons in this class
    for (let d = 0; d < DAYS; d++) {
      for (let p = 0; p < PERIODS_PER_DAY; p++) {
        // Skip the current slot
        if (d === day && p === period) continue;

        const otherLesson = timetable.schedule[className][d][p];

        // Only consider non-null lessons
        if (otherLesson) {
          const otherTeacher = getLessonTeacher(otherLesson);

          // Check if both teachers can be swapped
          const firstTeacherCanMoveTo =
            teacher.isAvailable(d, p) &&
            !this.isTeacherBusy(teacher, d, p, className);

          const secondTeacherCanMoveTo =
            otherTeacher.isAvailable(day, period) &&
            !this.isTeacherBusy(otherTeacher, day, period, className);

          if (firstTeacherCanMoveTo && secondTeacherCanMoveTo) {
            // Calculate a score for this swap - prefer nearby days and periods
            const dayDistance = Math.abs(d - day);
            const periodDistance = Math.abs(p - period);
            const distance = dayDistance + periodDistance;

            // Lower distance = higher score
            const score = 10 - distance;

            swapCandidates.push({
              day: d,
              period: p,
              lesson: otherLesson,
              score,
            });
          }
        }
      }
    }

    // Sort candidates by score (highest first)
    swapCandidates.sort((a, b) => b.score - a.score);

    // Try the best candidate
    if (swapCandidates.length > 0) {
      const bestCandidate = swapCandidates[0];

      // Swap the lessons
      timetable.schedule[className][bestCandidate.day][bestCandidate.period] =
        lesson;
      timetable.schedule[className][day][period] = bestCandidate.lesson;

      return true;
    }

    return false;
  }

  /**
   * Compact the schedule to remove gaps
   */
  compactSchedule(): void {
    for (const cls of this.classes) {
      const schedule = this.schedule[cls.name];

      for (let day = 0; day < DAYS; day++) {
        // Collect all lessons for this day
        const lessons: (Lesson | null)[] = [];
        for (let period = 0; period < PERIODS_PER_DAY; period++) {
          if (schedule[day][period] !== null) {
            lessons.push(schedule[day][period]);
          }
        }

        // Clear this day's schedule
        for (let period = 0; period < PERIODS_PER_DAY; period++) {
          schedule[day][period] = null;
        }

        // Reinsert lessons as compactly as possible
        if (lessons.length > 0) {
          for (let i = 0; i < lessons.length; i++) {
            schedule[day][i] = lessons[i];
          }
        }
      }
    }
  }
}

/**
 * Config type for scheduler
 */
export type SchedulerConfig = {
  initialPoolSize: number;
  maxESIterations: number;
  sigma: number;
  sigmaDecay: number;
  minSigma: number;
  maxStagnantIterations: number;
  maxAnnealingIterations: number;
  temperature: number;
  coolingRate: number;
  minTemperature: number;
};

export const DEFAULT_SCHEDULER_CONFIG: Readonly<SchedulerConfig> = {
  initialPoolSize: 10,
  maxESIterations: 10000,
  sigma: 2.0,
  sigmaDecay: 0.98,
  minSigma: 0.1,
  maxStagnantIterations: 500,
  maxAnnealingIterations: 2500,
  temperature: 0.5,
  coolingRate: 0.99,
  minTemperature: 0.00001,
};

/**
 * Class for scheduling timetables
 */
export class Scheduler {
  classes: Class[];
  config: SchedulerConfig;

  /**
   * Create a scheduler
   * @param classes - Classes to schedule
   * @param config - Config for the generation algorithm
   */
  constructor(
    classes: Class[] = [],
    config: SchedulerConfig = DEFAULT_SCHEDULER_CONFIG,
  ) {
    this.classes = classes;
    this.config = config;
  }

  /**
   * Calculate hard constraint violations for a timetable
   * @param timetable - The timetable to evaluate
   * @returns Number of violations (lower is better)
   * @private
   */
  private calculateHardConstraintViolations(timetable: Timetable): number {
    // Count availability violations separately with higher weight
    let availabilityViolations = 0;
    let doubleBookingViolations = 0;

    // Check every time slot for teacher availability and double-booking
    for (let day = 0; day < DAYS; day++) {
      for (let period = 0; period < PERIODS_PER_DAY; period++) {
        const teacherMap = new Map<string, number>();

        // Check all classes at this time slot
        for (const cls of timetable.classes) {
          const lesson = timetable.schedule[cls.name][day][period];
          if (lesson) {
            const teacher = getLessonTeacher(lesson);

            // Check teacher availability
            if (!teacher.isAvailable(day, period)) {
              availabilityViolations++;
            }

            // Track teacher usage for double-booking check
            teacherMap.set(
              teacher.name,
              (teacherMap.get(teacher.name) || 0) + 1,
            );
          }
        }

        // Count double bookings
        for (const [, count] of teacherMap.entries()) {
          if (count > 1) {
            doubleBookingViolations += count - 1;
          }
        }
      }
    }

    // Heavily weight double booking violations over availability violations
    const conflicts =
      availabilityViolations * 5000 + doubleBookingViolations * 20000;

    // Empty spaces are also a hard constraint but less severe
    const emptySpaces = timetable.countEmptySpacePenalty();

    return conflicts + emptySpaces;
  }

  /**
   * Generate a timetable
   * @returns Generated timetable
   */
  generateTimetable(): Timetable {
    console.log("Starting timetable generation process...");
    console.log("Config for generation", this.config);

    // PHASE 1: Initialize and solve hard constraints using (1+1) ES
    console.log("Phase 1: Solving hard constraints with (1+1) ES");

    // Create multiple initial timetables and pick the best one to start with
    const initialPoolSize = this.config.initialPoolSize;
    const initialTimetables: Timetable[] = [];
    for (let i = 0; i < initialPoolSize; i++) {
      const timetable = new Timetable(this.classes);
      initialTimetables.push(timetable);
    }

    // Find the best initial timetable based on hard constraints
    let current = initialTimetables.reduce((best, current) => {
      const bestHardConstraints = this.calculateHardConstraintViolations(best);
      const currentHardConstraints =
        this.calculateHardConstraintViolations(current);
      return currentHardConstraints < bestHardConstraints ? current : best;
    });

    // Parameters for (1+1) ES
    const {
      maxESIterations,
      sigma: startingSigma,
      sigmaDecay,
      minSigma,
      maxStagnantIterations,
    } = this.config;
    let sigma = startingSigma; // Mutation strength
    let stagnantIterations = 0;

    // For monitoring progress
    let currentViolations = this.calculateHardConstraintViolations(current);
    let best = current.clone();
    let bestViolations = currentViolations;

    // Schwefel's (1+1)-ES algorithm for hard constraints
    for (
      let i = 0;
      (i < maxESIterations || maxESIterations === 0) && bestViolations > 0;
      i++
    ) {
      // Create mutated offspring with focused mutation operator
      const offspring = this.createMutatedOffspring(current, sigma);
      const offspringViolations =
        this.calculateHardConstraintViolations(offspring);

      // Always accept improvements
      if (offspringViolations < currentViolations) {
        current = offspring;
        currentViolations = offspringViolations;

        // Update best solution if improved
        if (offspringViolations < bestViolations) {
          best = offspring.clone();
          bestViolations = offspringViolations;
          stagnantIterations = 0;
          sigma *= 1.1; // Increase exploration when successful
          sigma = Math.min(sigma, 4.0); // Cap sigma

          console.log(
            `Iteration ${i}: Found better solution with ${bestViolations} hard constraint violations`,
          );

          // If we found a solution with no hard constraint violations, we can break
          if (bestViolations === 0) {
            console.log("Found solution with no hard constraint violations!");
            break;
          }
        } else {
          stagnantIterations++;
        }
      } else {
        stagnantIterations++;
        // Adapt mutation strength using Schwefel's 1/5 success rule
        if (i % 10 === 0) {
          sigma *= sigmaDecay;
          sigma = Math.max(sigma, minSigma);
        }
      }

      // Check for stagnation - restart with the best solution
      if (stagnantIterations >= maxStagnantIterations) {
        console.log(
          `Stagnation detected after ${stagnantIterations} iterations, restarting with best solution`,
        );
        current = best.clone();
        currentViolations = bestViolations;
        stagnantIterations = 0;
        sigma = 2.0; // Reset sigma
      }

      // Log progress periodically
      if (i % 100 === 0) {
        console.log(
          `ES Iteration ${i}: Best violations = ${bestViolations}, Current violations = ${currentViolations}, Sigma = ${sigma.toFixed(4)}`,
        );
      }
    }

    // Final compaction to ensure no gaps
    best.compactSchedulePreservingTeacherAvailability();

    // Final validation and cleanup
    const finalConflicts = best.countTeacherConflicts();
    if (finalConflicts > 0) {
      console.error(
        `WARNING: Final solution still has ${finalConflicts} conflicts. Attempting one final repair...`,
      );
      this.emergencyCleanupTeacherViolations(best);
    }

    // Annealing
    best = this.optimizeSoftConstraints(best);

    // Final check
    const actualConflicts = best.countTeacherConflicts();
    const fitness = this.calculateFitness(best);
    console.log(
      `Final solution has ${actualConflicts} conflicts, fitness: ${fitness}`,
    );

    return best;
  }

  /**
   * Emergency cleanup to remove any remaining teacher violations
   * @param timetable - The timetable to fix
   */
  private emergencyCleanupTeacherViolations(timetable: Timetable): void {
    for (let day = 0; day < DAYS; day++) {
      for (let period = 0; period < PERIODS_PER_DAY; period++) {
        // First scan: detect and resolve double bookings (priority issue)
        const teacherAssignments = new Map<string, string[]>();

        // Collect all teacher assignments for this time slot
        for (const cls of timetable.classes) {
          const lesson = timetable.schedule[cls.name][day][period];
          if (!lesson) continue;

          const teacher = getLessonTeacher(lesson);
          const teacherName = teacher.name;

          if (!teacherAssignments.has(teacherName)) {
            teacherAssignments.set(teacherName, [cls.name]);
          } else {
            teacherAssignments.get(teacherName)!.push(cls.name);
          }
        }

        // Resolve double bookings first
        for (const [teacherName, classes] of teacherAssignments.entries()) {
          if (classes.length > 1) {
            console.error(
              `EMERGENCY FIX: Teacher ${teacherName} is double-booked on day ${day + 1}, period ${period + 1}`,
            );

            // Keep only the first class, remove others
            for (let i = 1; i < classes.length; i++) {
              const className = classes[i];
              console.error(`- Removing lesson from class ${className}`);
              timetable.schedule[className][day][period] = null;
            }
          }
        }

        // Second scan: remove any lessons where teacher is unavailable
        for (const cls of timetable.classes) {
          const lesson = timetable.schedule[cls.name][day][period];
          if (!lesson) continue;

          const teacher = getLessonTeacher(lesson);

          // CRITICAL CHECK: Remove if teacher is unavailable
          if (!teacher.isAvailable(day, period)) {
            console.error(
              `EMERGENCY FIX: Removing lesson ${getLessonName(lesson)} with unavailable teacher ${teacher.name} from class ${cls.name} on day ${day + 1}, period ${period + 1}`,
            );
            timetable.schedule[cls.name][day][period] = null;
          }
        }
      }
    }
  }

  /**
   * Create a mutated offspring using intelligent mutation operators
   * @param parent - The parent timetable
   * @param sigma - Mutation strength parameter
   * @returns A new mutated timetable
   * @private
   */
  private createMutatedOffspring(parent: Timetable, sigma: number): Timetable {
    const offspring = parent.clone();

    // Identify conflicts to target with mutations
    const conflicts = offspring.identifyConflicts(offspring);

    // No conflicts to resolve, use random mutations
    if (conflicts.length === 0) {
      return offspring.performRandomMutation(offspring);
    }

    // Determine number of mutations to apply based on sigma
    const mutationCount = Math.max(1, Math.floor(sigma));

    // Apply targeted mutations to resolve conflicts
    for (let i = 0; i < mutationCount; i++) {
      // Randomly select a conflict to resolve if available
      if (conflicts.length > 0) {
        const randomIndex = Math.floor(Math.random() * conflicts.length);
        const conflict = conflicts[randomIndex];

        // Try to resolve the selected conflict
        const resolved = offspring.resolveConflict(offspring, conflict);

        // If couldn't resolve with direct approach, try a more aggressive mutation
        if (!resolved) {
          // Apply a more aggressive mutation - try rebuilding the class schedule
          const classToRebuild = conflict.className;
          offspring.rebuildClassSchedule(offspring, classToRebuild);
        }
      } else {
        // Apply random mutation if no specific conflicts to target
        offspring.performRandomMutation(offspring);
      }
    }

    return offspring;
  }

  /**
   * Optimize soft constraints using simulated annealing
   * @param timetable - The timetable to optimize
   * @returns Optimized timetable
   * @private
   */
  private optimizeSoftConstraints(timetable: Timetable): Timetable {
    let current = timetable.clone();
    let currentFitness = this.calculateSoftConstraintsFitness(current);
    let best = current.clone();
    let bestFitness = currentFitness;

    // Annealing parameters
    const {
      temperature: startingTemperature,
      coolingRate,
      minTemperature,
    } = this.config;
    let temperature = startingTemperature; // Starting temperature

    // Annealing process
    const maxAnnealingIterations = 2500;

    console.log("Starting soft constraints optimization...");

    for (
      let i = 0;
      i < maxAnnealingIterations && temperature > minTemperature;
      i++
    ) {
      // Create neighbor by applying small mutations that preserve hard constraints
      const neighbor = this.createSoftConstraintNeighbor(current);

      // Ensure hard constraints are still satisfied
      if (this.calculateHardConstraintViolations(neighbor) > 0) {
        continue; // Skip this iteration if hard constraints would be violated
      }

      // Calculate fitness delta
      const neighborFitness = this.calculateSoftConstraintsFitness(neighbor);
      const delta = currentFitness - neighborFitness;

      // Accept if improvement or with probability based on temperature
      if (delta > 0 || Math.random() < Math.exp(delta / temperature)) {
        current = neighbor;
        currentFitness = neighborFitness;

        // Update best solution if improved
        if (neighborFitness < bestFitness) {
          best = neighbor.clone();
          bestFitness = neighborFitness;
          console.log(
            `Annealing iteration ${i}: Found better solution with soft fitness ${bestFitness.toFixed(2)}`,
          );
        }
      }

      // Cool the temperature
      temperature *= coolingRate;

      // Log progress periodically
      if (i % 250 === 0) {
        console.log(
          `Annealing iteration ${i}: Temperature ${temperature.toFixed(5)}, Best fitness ${bestFitness.toFixed(2)}`,
        );
      }
    }

    return best;
  }

  /**
   * Create a neighbor solution for soft constraint optimization
   * @param timetable - The current timetable
   * @returns A new timetable with soft constraint focused mutations
   * @private
   */
  private createSoftConstraintNeighbor(timetable: Timetable): Timetable {
    const neighbor = timetable.clone();

    // Determine number of small mutations to apply (1-3)
    const mutationCount = 1 + Math.floor(Math.random() * 3);

    for (let i = 0; i < mutationCount; i++) {
      // Choose a random mutation type focused on soft constraints
      const mutationType = Math.random();

      if (mutationType < 0.4) {
        // Swap two random periods within the same day for a class
        const randomClassIndex = Math.floor(
          Math.random() * neighbor.classes.length,
        );
        const randomClass = neighbor.classes[randomClassIndex];
        neighbor.swapRandomPeriodsInSameDay(neighbor, randomClass);
      } else if (mutationType < 0.8) {
        // Swap lessons between two different days
        const randomClassIndex = Math.floor(
          Math.random() * neighbor.classes.length,
        );
        const randomClass = neighbor.classes[randomClassIndex];
        neighbor.swapLessonsBetweenDays(neighbor, randomClass);
      } else {
        // Shuffle all lessons in a day
        const randomClassIndex = Math.floor(
          Math.random() * neighbor.classes.length,
        );
        const randomClass = neighbor.classes[randomClassIndex];
        neighbor.shuffleDayLessons(neighbor, randomClass);
      }
    }

    // Ensure the schedule remains compact (no gaps)
    neighbor.compactSchedule();

    return neighbor;
  }

  /**
   * Calculate fitness for soft constraints only
   * @param timetable - The timetable to evaluate
   * @returns Fitness score for soft constraints (lower is better)
   * @private
   */
  private calculateSoftConstraintsFitness(timetable: Timetable): number {
    // Focus only on soft constraints and optimization criteria
    const unscheduled = timetable.countUnscheduledPeriods() * 50; // Unscheduled periods
    const freeFirstPeriods =
      Math.max(0, 5 - timetable.countFreeFirstPeriods()) * 2; // Preference for free first periods

    // Calculate distribution penalty
    let distributionPenalty = 0;

    // Penalize uneven distribution of subjects across the week
    for (const cls of timetable.classes) {
      // Track lessons per subject on each day
      const subjectCounts = new Map<string, number[]>();

      // Initialize counts for each subject
      for (const lesson of cls.lessons) {
        if (!subjectCounts.has(getLessonName(lesson))) {
          subjectCounts.set(getLessonName(lesson), Array(DAYS).fill(0));
        }
      }

      // Count occurrences
      for (let day = 0; day < DAYS; day++) {
        for (let period = 0; period < PERIODS_PER_DAY; period++) {
          const lesson = timetable.schedule[cls.name][day][period];
          if (lesson) {
            const counts = subjectCounts.get(getLessonName(lesson))!;
            counts[day]++;
          }
        }
      }

      // Calculate distribution penalty for each subject
      for (const [, dayCounts] of subjectCounts.entries()) {
        // Find min and max counts
        const nonZeroCounts = dayCounts.filter(count => count > 0);
        if (nonZeroCounts.length > 1) {
          const min = Math.min(...nonZeroCounts);
          const max = Math.max(...nonZeroCounts);

          // Penalize big differences
          if (max - min > 1) {
            distributionPenalty += max - min - 1;
          }
        }
      }
    }

    // Calculate teacher and group idle time penalties
    const teacherIdlePenalty = this.calculateTeacherIdlePenalty(timetable) * 3;
    const groupIdlePenalty = this.calculateGroupIdlePenalty(timetable) * 5;

    // Check if there's at least one free hour in the week where no teaching occurs
    const freeHourPenalty = this.hasFreeHourInWeek(timetable) ? 0 : 100;

    // Too many classes of the same type in a day
    let sameClassesPenality = 0;
    for (const cls of timetable.classes) {
      for (let day = 0; day < DAYS; day++) {
        const classesObj = {} as { [key: string]: { count: number } };
        for (let period = 0; period < PERIODS_PER_DAY; period++) {
          const lesson = timetable.schedule[cls.name][day][period];
          if (!lesson) {
            continue;
          }

          if (getLessonName(lesson) in classesObj) {
            classesObj[getLessonName(lesson)].count++;
            if (classesObj[getLessonName(lesson)].count > 2) {
              sameClassesPenality += 1;
            }
          } else {
            classesObj[getLessonName(lesson)] = { count: 1 };
          }
        }
      }
    }

    return (
      unscheduled +
      freeFirstPeriods +
      distributionPenalty +
      teacherIdlePenalty +
      groupIdlePenalty +
      freeHourPenalty +
      sameClassesPenality
    );
  }

  /**
   * Calculate idle time penalty for teachers
   * @param timetable - The timetable to evaluate
   * @returns Penalty score for teacher idle time
   * @private
   */
  private calculateTeacherIdlePenalty(timetable: Timetable): number {
    let totalPenalty = 0;
    const teacherSchedule: Map<string, Map<number, number[]>> = new Map();

    // Build teacher schedule
    for (const cls of timetable.classes) {
      for (let day = 0; day < DAYS; day++) {
        for (let period = 0; period < PERIODS_PER_DAY; period++) {
          const lesson = timetable.schedule[cls.name][day][period];
          if (lesson) {
            const teacherName = getLessonTeacher(lesson).name;

            if (!teacherSchedule.has(teacherName)) {
              teacherSchedule.set(teacherName, new Map());
            }

            const teacherDays = teacherSchedule.get(teacherName)!;
            if (!teacherDays.has(day)) {
              teacherDays.set(day, []);
            }

            const periods = teacherDays.get(day)!;
            if (!periods.includes(period)) {
              periods.push(period);
            }
          }
        }
      }
    }

    // Calculate idle time for each teacher
    for (const [, teacherDays] of teacherSchedule.entries()) {
      for (const [, periods] of teacherDays.entries()) {
        if (periods.length <= 1) continue;

        // Sort periods
        periods.sort((a, b) => a - b);

        // Calculate idle time
        for (let i = 1; i < periods.length; i++) {
          const gap = periods[i] - periods[i - 1] - 1;
          if (gap > 0) {
            // Penalize gaps: 1 hour=1, 2 hours=3, 3+ hours=5*gap
            totalPenalty += gap === 1 ? 1 : gap === 2 ? 3 : 5 * gap;
          }
        }
      }
    }

    return totalPenalty;
  }

  /**
   * Calculate idle time penalty for groups
   * @param timetable - The timetable to evaluate
   * @returns Penalty score for group idle time
   * @private
   */
  private calculateGroupIdlePenalty(timetable: Timetable): number {
    let totalPenalty = 0;
    const groups = new Set<string>();

    // Extract all unique groups
    for (const cls of timetable.classes) {
      groups.add(cls.name);
    }

    // Calculate idle time for each group on each day
    for (const group of groups) {
      for (let day = 0; day < DAYS; day++) {
        const schedule = timetable.schedule[group];
        const periods: number[] = [];

        // Find periods where this group has classes
        for (let period = 0; period < PERIODS_PER_DAY; period++) {
          if (schedule[day][period] !== null) {
            periods.push(period);
          }
        }

        // Sort periods and calculate idle time
        if (periods.length > 1) {
          periods.sort((a, b) => a - b);

          for (let i = 1; i < periods.length; i++) {
            const gap = periods[i] - periods[i - 1] - 1;
            if (gap > 0) {
              // Penalize gaps: 1 hour=1, 2 hours=3, 3+ hours=5*gap
              totalPenalty += gap === 1 ? 1 : gap === 2 ? 3 : 5 * gap;
            }
          }
        }
      }
    }

    return totalPenalty;
  }

  /**
   * Check if there is at least one free hour in the week where no teaching occurs
   * @param timetable - The timetable to evaluate
   * @returns Whether there is a free hour
   * @private
   */
  private hasFreeHourInWeek(timetable: Timetable): boolean {
    for (let day = 0; day < DAYS; day++) {
      for (let period = 0; period < PERIODS_PER_DAY; period++) {
        let hasClassAtTime = false;

        // Check if any class has a lesson at this time
        for (const cls of timetable.classes) {
          if (timetable.schedule[cls.name][day][period] !== null) {
            hasClassAtTime = true;
            break;
          }
        }

        if (!hasClassAtTime) {
          return true; // Found a free hour
        }
      }
    }

    return false; // No free hour found
  }

  /**
   * Calculate fitness of a timetable
   * @param timetable - Timetable to evaluate
   * @returns Fitness score (lower is better)
   * @private
   */
  private calculateFitness(timetable: Timetable): number {
    // Calculate both hard and soft constraints for total fitness
    const hardConstraints = this.calculateHardConstraintViolations(timetable);
    const softConstraints = this.calculateSoftConstraintsFitness(timetable);

    // Hard constraints are weighted much higher
    return hardConstraints * 1000 + softConstraints;
  }
}

/**
 * Export teachers data to CSV
 * @param teachers - List of teachers to export
 * @param filename - Output filename
 * @returns Promise resolving to the filename
 */
export function exportTeachersToCSV(
  teachers: Teacher[],
  filename = "teachers.csv",
): Promise<string> {
  return new Promise(resolve => {
    // Create CSV header
    let csvContent = "Name";

    // Add day columns for availability buffer
    for (let day = 0; day < DAYS; day++) {
      csvContent += `,Day${day + 1}`;
    }
    csvContent += "\r\n";

    // Add data for each teacher
    for (const teacher of teachers) {
      csvContent += `${teacher.name}`;

      // Add availability buffer data for each day
      for (let day = 0; day < DAYS; day++) {
        csvContent += `,${teacher.availability.buffer[day]}`;
      }
      csvContent += "\r\n";
    }

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = filename;
    downloadLink.style.display = "none";

    document.body.appendChild(downloadLink);
    downloadLink.click();

    setTimeout(() => {
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
      resolve(filename);
    }, 100);
  });
}

/**
 * Export classes data to CSV
 * @param classes - List of classes to export
 * @param filename - Output filename
 * @returns Promise resolving to the filename
 */
export function exportClassesToCSV(
  classes: Class[],
  filename = "classes.csv",
): Promise<string> {
  return new Promise(resolve => {
    // Create CSV header and detailed data in one section for better import compatibility
    let csvContent = "Class Name\r\n";

    // Add all class data in a consistent format
    for (const cls of classes) {
      csvContent += `${cls.name}\r\n`;
    }

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = filename;
    downloadLink.style.display = "none";

    document.body.appendChild(downloadLink);
    downloadLink.click();

    setTimeout(() => {
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
      resolve(filename);
    }, 100);
  });
}

/**
 * Export lessons data to CSV
 * @param lessons - List of lessons to export
 * @param className - Optional class name for class-specific export
 * @param filename - Output filename
 * @returns Promise resolving to the filename
 */
export function exportLessonsToCSV(
  lessons: Lesson[],
  className: string | null = null,
  filename = "lessons.csv",
): Promise<string> {
  return new Promise(resolve => {
    // Create CSV header
    let csvContent = "Subject,Teacher,PeriodsPerWeek,Class\r\n";

    // Add data for each lesson
    for (const lesson of lessons) {
      csvContent += `${getLessonName(lesson)},${getLessonTeacher(lesson).name},${lesson.periodsPerWeek},${className || ""}\r\n`;
    }

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = className ? `${className}-lessons.csv` : filename;
    downloadLink.style.display = "none";

    document.body.appendChild(downloadLink);
    downloadLink.click();

    setTimeout(() => {
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
      resolve(filename);
    }, 100);
  });
}

/**
 * Export lessons for a specific class to CSV
 * @param classObj - The class to export lessons for
 * @returns Promise resolving to the filename
 */
export function exportClassLessonsToCSV(classObj: Class): Promise<string> {
  return exportLessonsToCSV(classObj.lessons, classObj.name);
}

/**
 * Import teachers data from CSV
 * @param file - The CSV file to import
 * @returns Promise resolving to an array of Teacher objects
 */
export function importTeachersFromCSV(file: File): Promise<Teacher[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = event => {
      try {
        const csvText = event.target?.result as string;
        if (!csvText) {
          reject(new Error("Failed to read file"));
          return;
        }

        const teachers: Teacher[] = [];
        // Parse CSV content
        const lines = csvText.split("\n");

        // Skip header line
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const parts = line.split(",");
          if (parts.length >= 1 + DAYS) {
            // Name + day buffers
            const name = parts[0];

            // Create availability
            const availability = new Availability(DAYS, PERIODS_PER_DAY);

            // Parse buffer values for each day
            for (let day = 0; day < DAYS; day++) {
              if (parts[day + 1] && !isNaN(parseInt(parts[day + 1]))) {
                availability.buffer[day] = parseInt(parts[day + 1]);
              }
            }

            teachers.push(new Teacher(name.trim(), availability));
          }
        }

        resolve(teachers);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error("Error reading file"));
    };

    reader.readAsText(file);
  });
}

/**
 * Import classes data from CSV
 * @param file - The CSV file to import
 * @param teachers - List of existing teachers to reference
 * @returns Promise resolving to an array of Class objects
 */
export function importClassesFromCSV(file: File): Promise<Class[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = event => {
      try {
        const csvText = event.target?.result as string;
        if (!csvText) {
          reject(new Error("Failed to read file"));
          return;
        }

        const classes = [] as Class[];

        // Parse CSV content
        const lines = csvText.split("\n");
        for (let i = 1; i < lines.length; i++) {
          const name = lines[i].trim();
          if (!name) continue;

          let classExists = false;
          for (const cls of classes) {
            if (cls.name === name) {
              classExists = true;
            }
          }

          if (!classExists) {
            classes.push(new Class(name, []));
          }
        }

        resolve(Array.from(classes));
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error("Error reading file"));
    };

    reader.readAsText(file);
  });
}

/**
 * Import lessons data from CSV
 * @param file - The CSV file to import
 * @param teachers - List of existing teachers to reference
 * @param classes - List of existing classes to add lessons to
 * @param targetClassName - Optional class name to import specifically for
 * @returns Promise resolving to an updated array of Class objects
 */
export function importLessonsFromCSV(
  file: File,
  teachers: Teacher[],
  classes: Class[],
  targetClassName: string | null = null,
): Promise<Class[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = event => {
      try {
        const csvText = event.target?.result as string;
        if (!csvText) {
          reject(new Error("Failed to read file"));
          return;
        }

        // Create a map of classes for easy access
        const classMap = new Map<string, Class>();
        classes.forEach(cls => {
          classMap.set(cls.name, new Class(cls.name, [...cls.lessons]));
        });

        // Parse CSV content
        const lines = csvText.split("\n");

        // Check for header
        if (lines.length === 0) {
          reject(new Error("CSV file is empty"));
          return;
        }

        // Validate header and determine column indexes
        const header = lines[0].trim().toLowerCase();
        const isStandardFormat =
          header.includes("subject") &&
          header.includes("teacher") &&
          header.includes("periodsperweek");

        if (!isStandardFormat) {
          reject(
            new Error(
              "CSV file format is not recognized. Expected columns: Subject, Teacher, PeriodsPerWeek, Class",
            ),
          );
          return;
        }

        // Skip header line
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const parts = line.split(",");
          if (parts.length >= 3) {
            const [subjectName, teacherName, periodsPerWeekStr, className] =
              parts;

            // Skip empty entries
            if (!subjectName.trim() || !teacherName.trim()) continue;

            // Find the teacher by name
            const teacher = teachers.find(t => t.name === teacherName.trim());
            if (!teacher) {
              console.warn(
                `Teacher "${teacherName}" not found, skipping lesson "${subjectName}"`,
              );
              continue;
            }

            // Create the lesson
            const periodsPerWeek = parseInt(periodsPerWeekStr) || 1;
            const lesson = {
              name: subjectName.trim(),
              teacher,
              periodsPerWeek,
              type: "normal" as const,
            };

            // Determine which class to add the lesson to
            let classToUpdate = className?.trim() || "";

            // If a target class is specified and this lesson doesn't match, skip it
            if (
              targetClassName &&
              classToUpdate &&
              classToUpdate !== targetClassName
            ) {
              continue;
            }

            // If no class specified in CSV but we have a target class, use that
            if (!classToUpdate && targetClassName) {
              classToUpdate = targetClassName;
            }

            // If we have a valid class, add the lesson to it
            if (classToUpdate && classMap.has(classToUpdate)) {
              const classObj = classMap.get(classToUpdate)!;
              const updatedLessons = [...classObj.lessons, lesson];
              classMap.set(
                classToUpdate,
                new Class(classToUpdate, updatedLessons),
              );
            } else if (classToUpdate) {
              // Check if we should create a new class
              const createNewClass = confirm(
                `Class "${classToUpdate}" not found. Would you like to create it?`,
              );
              if (createNewClass) {
                classMap.set(classToUpdate, new Class(classToUpdate, [lesson]));
              } else {
                console.warn(
                  `Skipping lesson "${subjectName}" as class "${classToUpdate}" was not created.`,
                );
              }
            } else {
              console.warn(
                `No class specified for lesson "${subjectName}", skipping`,
              );
            }
          }
        }

        resolve(Array.from(classMap.values()));
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error("Error reading file"));
    };

    reader.readAsText(file);
  });
}

/**
 * Export all app data (teachers, classes, lessons) to a single CSV file
 * @param teachers - List of teachers to export
 * @param classes - List of classes with their lessons to export
 * @param filename - Output filename
 * @returns Promise resolving to the filename
 */
export function exportAllDataToCSV(
  teachers: Teacher[],
  classes: Class[],
  filename = "timetable-weaver-data.csv",
): Promise<string> {
  return new Promise(resolve => {
    // Create CSV with sections for different data types
    let csvContent = "# TIMETABLE WEAVER DATA EXPORT\r\n\r\n";

    // TEACHERS SECTION
    csvContent += "## TEACHERS\r\n";
    csvContent += "Name";

    // Add day columns for availability buffer
    for (let day = 0; day < DAYS; day++) {
      csvContent += `,Day${day + 1}`;
    }
    csvContent += "\r\n";

    // Add data for each teacher
    for (const teacher of teachers) {
      csvContent += `${teacher.name}`;

      // Add availability buffer data for each day
      for (let day = 0; day < DAYS; day++) {
        csvContent += `,${teacher.availability.buffer[day]}`;
      }
      csvContent += "\r\n";
    }

    // CLASSES AND LESSONS SECTION
    csvContent += "\r\n## CLASSES AND LESSONS\r\n";
    csvContent += "Subject,Teacher,PeriodsPerWeek,Class\r\n";

    // Add all classes and their lessons
    for (const cls of classes) {
      // If the class has no lessons, add a placeholder row
      if (cls.lessons.length === 0) {
        csvContent += `[Empty Class],N/A,0,${cls.name}\r\n`;
      }

      // Add lessons for each class
      for (const lesson of cls.lessons) {
        csvContent += `${getLessonName(lesson)},${getLessonTeacher(lesson).name},${lesson.periodsPerWeek},${cls.name}\r\n`;
      }
    }

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = filename;
    downloadLink.style.display = "none";

    document.body.appendChild(downloadLink);
    downloadLink.click();

    setTimeout(() => {
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
      resolve(filename);
    }, 100);
  });
}

/**
 * Generate example data file for import
 * @returns Promise resolving to the filename
 */
export function generateExampleDataFile(): Promise<string> {
  const exampleTeachers = [
    new Teacher("John Smith", new Availability(DAYS, PERIODS_PER_DAY)),
    new Teacher("Jane Doe", new Availability(DAYS, PERIODS_PER_DAY)),
  ];

  // Make all slots available for example teachers
  for (const teacher of exampleTeachers) {
    for (let day = 0; day < DAYS; day++) {
      teacher.availability.setDay(day, true);
    }
  }

  // Make a few specific slots unavailable for demonstration
  exampleTeachers[0].availability.set(0, 2, false); // Monday, period 3
  exampleTeachers[1].availability.set(2, 1, false); // Wednesday, period 2

  const math = {
    name: "Mathematics",
    teacher: exampleTeachers[0],
    periodsPerWeek: 5,
    type: "normal" as const,
  };
  const english = {
    name: "English",
    teacher: exampleTeachers[1],
    periodsPerWeek: 4,
    type: "normal" as const,
  };
  const science = {
    name: "Science",
    teacher: exampleTeachers[0],
    periodsPerWeek: 3,
    type: "normal" as const,
  };

  const exampleClasses = [
    new Class("10A", [math, english]),
    new Class("11B", [math, science]),
  ];

  return exportAllDataToCSV(
    exampleTeachers,
    exampleClasses,
    "timetable-weaver-example.csv",
  );
}

/**
 * Import all app data from a single CSV file
 * @param file - The CSV file to import
 * @returns Promise resolving to an object containing teachers and classes arrays
 */
export function importAllDataFromCSV(
  file: File,
): Promise<{ teachers: Teacher[]; classes: Class[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = event => {
      try {
        const csvText = event.target?.result as string;
        if (!csvText) {
          reject(new Error("Failed to read file"));
          return;
        }

        console.log("CSV file loaded, content length:", csvText.length);

        const teachers: Teacher[] = [];
        const classMap = new Map<string, Class>();

        // Parse CSV content by sections
        const lines = csvText.split(/\r?\n/); // Handle both Windows and Unix line endings
        console.log(`Parsed ${lines.length} lines from CSV`);

        let currentSection = "";
        let headerProcessed = false;
        let teachersFound = false;
        let classesFound = false;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // Check for section headers
          if (
            line.startsWith("## TEACHERS") ||
            line.toLowerCase().includes("teachers")
          ) {
            currentSection = "TEACHERS";
            headerProcessed = false;
            teachersFound = true;
            console.log("Found TEACHERS section at line", i);
            continue;
          } else if (
            line.startsWith("## CLASSES") ||
            line.toLowerCase().includes("classes and lessons")
          ) {
            currentSection = "CLASSES";
            headerProcessed = false;
            classesFound = true;
            console.log("Found CLASSES section at line", i);
            continue;
          } else if (line.startsWith("#")) {
            // Skip other comment lines
            continue;
          }

          // Process data based on current section
          if (currentSection === "TEACHERS") {
            if (!headerProcessed) {
              // This is the header line
              headerProcessed = true;
              console.log("Processing teachers header:", line);
              continue;
            }

            const parts = line.split(",");
            if (parts.length >= 1 + DAYS) {
              // Name + day buffers
              const name = parts[0];

              // Create availability
              const availability = new Availability(DAYS, PERIODS_PER_DAY);

              // Parse buffer values for each day
              for (let day = 0; day < DAYS; day++) {
                if (parts[day + 1] && !isNaN(parseInt(parts[day + 1]))) {
                  availability.buffer[day] = parseInt(parts[day + 1]);
                }
              }

              teachers.push(new Teacher(name.trim(), availability));
              console.log(`Added teacher: ${name.trim()} with availability`);
            } else {
              console.warn(`Invalid teacher data at line ${i + 1}: ${line}`);
            }
          } else if (currentSection === "CLASSES") {
            if (!headerProcessed) {
              // This is the header line
              headerProcessed = true;
              console.log("Processing classes header:", line);
              continue;
            }

            const parts = line.split(",");
            if (parts.length >= 4) {
              const [subjectName, teacherName, periodsPerWeekStr, className] =
                parts;

              // Handle empty class placeholder
              if (subjectName.trim() === "[Empty Class]") {
                if (!classMap.has(className.trim())) {
                  classMap.set(
                    className.trim(),
                    new Class(className.trim(), []),
                  );
                  console.log(`Added empty class: ${className.trim()}`);
                }
                continue;
              }

              // Find the teacher by name
              const teacher = teachers.find(t => t.name === teacherName.trim());
              if (!teacher) {
                console.warn(
                  `Teacher "${teacherName}" not found, skipping lesson "${subjectName}"`,
                );
                continue;
              }

              // Create the lesson
              const periodsPerWeek = parseInt(periodsPerWeekStr) || 1;
              const lesson = {
                name: subjectName.trim(),
                teacher,
                periodsPerWeek,
                type: "normal" as const,
              };

              // Get or create the class
              if (!classMap.has(className.trim())) {
                classMap.set(className.trim(), new Class(className.trim(), []));
              }

              // Add the lesson to the class
              const classObj = classMap.get(className.trim())!;
              const updatedLessons = [...classObj.lessons, lesson];
              classMap.set(
                className.trim(),
                new Class(className.trim(), updatedLessons),
              );
              console.log(
                `Added lesson "${subjectName.trim()}" to class ${className.trim()}`,
              );
            } else {
              console.warn(
                `Invalid class/lesson data at line ${i + 1}: ${line}`,
              );
            }
          }
        }

        // Handle case where file format is completely different but might be valid
        if (!teachersFound && !classesFound) {
          console.log(
            "No section headers found, attempting to parse as simple CSV",
          );
          try {
            // Try parsing as a simple flat CSV with all data
            const simpleParse = parseSimpleCsvFormat(csvText);
            if (
              simpleParse.teachers.length > 0 ||
              simpleParse.classes.length > 0
            ) {
              console.log("Successfully parsed as simple CSV format");
              resolve(simpleParse);
              return;
            }
          } catch (e) {
            console.error("Failed to parse as simple CSV:", e);
            // Continue with original parsing result
          }
        }

        if (teachers.length === 0 && classMap.size === 0) {
          reject(
            new Error(
              "No valid data found in the file. Please use the example file as a template.",
            ),
          );
          return;
        }

        console.log(
          `Import completed: ${teachers.length} teachers, ${classMap.size} classes`,
        );
        resolve({
          teachers: teachers,
          classes: Array.from(classMap.values()),
        });
      } catch (error) {
        console.error("Error parsing CSV file:", error);
        reject(error);
      }
    };

    reader.onerror = error => {
      console.error("FileReader error:", error);
      reject(new Error("Error reading file"));
    };

    reader.readAsText(file);
  });
}

/**
 * Try to parse a simple CSV format without section headers
 * @param csvText - The CSV text content
 * @returns Object containing teachers and classes arrays
 */
function parseSimpleCsvFormat(csvText: string): {
  teachers: Teacher[];
  classes: Class[];
} {
  const teachers: Teacher[] = [];
  const classMap = new Map<string, Class>();

  // Try to infer the format based on the header
  const lines = csvText.split(/\r?\n/);
  if (lines.length < 2) {
    throw new Error("Not enough data in file");
  }

  const header = lines[0].toLowerCase();

  // Check if this looks like a teacher-focused file
  if (header.includes("name") && header.includes("day")) {
    // Process as teachers data
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(",");
      if (parts.length >= 2) {
        const name = parts[0].trim();
        const availability = new Availability(DAYS, PERIODS_PER_DAY);

        // Try to parse availability data if present
        for (let day = 0; day < Math.min(DAYS, parts.length - 1); day++) {
          if (parts[day + 1] && !isNaN(parseInt(parts[day + 1]))) {
            availability.buffer[day] = parseInt(parts[day + 1]);
          }
        }

        teachers.push(new Teacher(name, availability));
      }
    }
  }
  // Check if this looks like a class/lesson-focused file
  else if (
    header.includes("subject") &&
    header.includes("teacher") &&
    (header.includes("periods") || header.includes("class"))
  ) {
    // Process as classes/lessons data
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(",");
      if (parts.length >= 3) {
        const subjectName = parts[0].trim();
        const teacherName = parts[1].trim();
        let periodsPerWeek = 1;
        let className = "";

        // Try to parse periods and class name
        if (parts.length >= 4) {
          periodsPerWeek = parseInt(parts[2]) || 1;
          className = parts[3].trim();
        } else {
          // Fallback if class name not specified
          className = "Default Class";
        }

        // Create placeholder teacher if needed
        let teacher = teachers.find(t => t.name === teacherName);
        if (!teacher) {
          const availability = new Availability(DAYS, PERIODS_PER_DAY);
          // Make all slots available by default
          for (let day = 0; day < DAYS; day++) {
            availability.setDay(day, true);
          }
          teacher = new Teacher(teacherName, availability);
          teachers.push(teacher);
        }

        // Create the lesson
        const lesson = {
          name: subjectName,
          teacher,
          periodsPerWeek,
          type: "normal" as const,
        };

        // Add to class
        if (!classMap.has(className)) {
          classMap.set(className, new Class(className, []));
        }

        const classObj = classMap.get(className)!;
        const updatedLessons = [...classObj.lessons, lesson];
        classMap.set(className, new Class(className, updatedLessons));
      }
    }
  }

  return {
    teachers: teachers,
    classes: Array.from(classMap.values()),
  };
}
