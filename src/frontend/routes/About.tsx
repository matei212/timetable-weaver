const About: React.FC = () => {
  return (
    <div className="mx-auto max-w-4xl p-5">
      <h2 className="mb-6 text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-cyan-400 dark:from-blue-400 dark:to-cyan-300">Despre Timetable Weaver</h2>
      
      <div className="prose prose-lg dark:prose-invert mx-auto">
        <p className="mb-4 text-lg leading-relaxed dark:text-gray-200">
          <span className="font-semibold text-blue-600 dark:text-blue-400">Timetable Weaver</span> reprezintă o soluție software de înaltă performanță dedicată instituțiilor de învățământ, concepută pentru automatizarea și optimizarea procesului complex de generare a orarelor.
        </p>
        
        <p className="mb-4 dark:text-gray-300">
          Această aplicație inovatoare implementează algoritmi avansați de optimizare combinatorială pentru a elabora orare școlare care respectă toate constrângerile impuse, oferind astfel o soluție elegantă și eficientă pentru o problemă de planificare deosebit de complexă.
        </p>
        
        <h3 className="text-xl font-semibold mt-6 mb-3 text-gray-800 dark:text-gray-100">Algoritm de Optimizare Avansat</h3>
        <p className="mb-4 dark:text-gray-300">
          La baza aplicației stă un sistem hibrid de algoritmi care combină strategii evolutive (ES) cu tehnici de recoacere simulată (simulated annealing), permițând identificarea soluțiilor optime într-un spațiu vast de posibilități. Această abordare modernă asigură:
        </p>
        
        <ul className="list-disc pl-6 mb-4 space-y-2 dark:text-gray-300">
          <li>Eliminarea conflictelor de programare între profesori</li>
          <li>Respectarea disponibilității cadrelor didactice</li>
          <li>Distribuția echilibrată a materiilor pe parcursul săptămânii</li>
          <li>Minimizarea "ferestrelor" neproductive în orar</li>
        </ul>
        
        <h3 className="text-xl font-semibold mt-6 mb-3 text-gray-800 dark:text-gray-100">Arhitectură Modernă</h3>
        <p className="mb-4 dark:text-gray-300">
          Dezvoltată pe baza unor tehnologii de ultimă generație, aplicația oferă o experiență utilizator fluidă și intuitivă. Interfața responsivă și designul centrat pe utilizator facilitează procesul de configurare, generare și gestionare a orarelor, chiar și pentru persoanele cu experiență limitată în utilizarea aplicațiilor software.
        </p>
        
        <h3 className="text-xl font-semibold mt-6 mb-3 text-gray-800 dark:text-gray-100">Beneficii Principale</h3>
        <ul className="list-disc pl-6 mb-4 space-y-2 dark:text-gray-300">
          <li>Reducerea semnificativă a timpului dedicat creării orarelor (de la zile la minute)</li>
          <li>Optimizarea utilizării resurselor educaționale disponibile</li>
          <li>Adaptabilitate la cerințe specifice și constrângeri personalizate</li>
          <li>Sistem intuitiv de import/export pentru integrare facilă cu alte sisteme</li>
          <li>Interfață vizuală pentru ajustări fine și personalizări după generare</li>
        </ul>
        
        <p className="mt-6 italic text-gray-600 dark:text-gray-400 text-center">
          Timetable Weaver transformă procesul tradițional, consumator de timp și predispus la erori, într-o experiență eficientă și precisă, contribuind la optimizarea întregului sistem educațional.
        </p>
      </div>
    </div>
  );
};

export default About;
