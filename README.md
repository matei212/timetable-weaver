# Timetable Weaver - Descriere

Timetable Weaver este o aplicație web modernă și eficientă, concepută pentru generarea automată a orarelor școlare. Aplicația folosește algoritmi avansați de optimizare pentru a crea orare care respectă toate constrângerile necesare, oferind o soluție elegantă pentru o problemă complexă de planificare.

Poate fi accesat aici: https://timetable-weaver.vercel.app/

## Caracteristici principale

-   **Interfață intuitivă**: O interfață prietenoasă care permite gestionarea eficientă a claselor, profesorilor și lecțiilor.
-   **Import și export de date**: Posibilitatea de a importa date în format CSV și de a exporta orarele generate în format PDF.
-   **Algoritm avansat de optimizare**: Utilizează o combinație inovatoare între algoritmi genetici și simulated annealing (simulare de recoacere) pentru a genera orare optimale.
-   **Gestionare constrângeri**: Respectă atât constrângeri stricte (ex: profesorii nu pot fi programați simultan la mai multe clase), cât și constrângeri flexibile (ex: distribuția uniformă a lecțiilor).
-   **Salvare automată**: Datele introduse sunt salvate automat în browser pentru a preveni pierderea informațiilor.

## Cum să utilizați aplicația

### 1. Instalare și pornire

Pentru a rula aplicația local, urmați acești pași:

```bash
git clone https://github.com/matei212/timetable-weaver.git
cd timetable-weaver
npm install
npm run dev
```

Aplicația va fi disponibilă la [http://localhost:3000](http://localhost:3000) și, de asemenea, în rețeaua locală.

### 2. Autentificare și Acces

Înainte de a putea configura datele, este obligatoriu să vă creați un cont sau să vă autentificați. Acest pas este esențial pentru securitatea datelor, asigurând că fiecare orar este salvat și asociat contului de administrator corespunzător, prevenind astfel accesul neautorizat și pierderea informațiilor.

### 3. Configurarea datelor

-   Accesați secțiunea **"Profesori"** pentru a adăuga și configura disponibilitatea acestora.
-   Mergeți la **"Clase"** pentru a defini clasele și a adăuga elevii.
-   În secțiunea **"Lecții"**, configurați materiile și alocați profesorii pentru fiecare clasă.

### 4. Generarea orarului

-   Accesați secțiunea **"Prezentare generală"** și utilizați butonul **"Generează orar"**.
-   Algoritmul va procesa constrângerile și va genera un orar optim.
-   Puteți vizualiza orarul și îl puteți ajusta manual, dacă este necesar.

### 5. Exportarea rezultatelor

-   După ce sunteți mulțumiți de orar, acesta poate fi exportat în format **PDF**.
-   Orarul poate fi apoi distribuit profesorilor și elevilor.

## Fluxul de Autentificare și Roluri

Pentru a putea accesa funcționalitățile principale ale aplicației, este necesară crearea unui cont sau autentificarea. Aplicația implementează un sistem de roluri pentru a gestiona accesul la funcționalități.

### Rolul de Administrator (`admin`)

1.  **Crearea Contului**: Primul utilizator care își creează un cont în aplicație primește automat rolul de `admin`.
2.  **Crearea Orarului**: Din secțiunea "Profil", administratorul poate genera un nou orar.
3.  **Management**: Odată creat, orarul poate fi selectat de pe pagina principală. Administratorul are control total și poate adăuga profesori, clase și materii.
4.  **Delegarea către Profesori**: Atunci când adaugă un profesor, administratorul îi poate asocia o adresă de e-mail. Aceasta servește drept invitație pentru profesor.

### Rolul de Profesor (`teacher`)

1.  **Acces**: Un utilizator cu rolul de `teacher` se poate autentifica folosind adresa de e-mail adăugată de administrator.
2.  **Permisiuni Limitate**: Profesorii pot doar să își vizualizeze și să își editeze propria disponibilitate. Ei nu au acces la vizualizarea întregului orar sau la modificarea altor date.
3.  **Securitate**: Nu au acces să modifice alte date, precum clasele, materiile sau disponibilitatea altor profesori, asigurând astfel integritatea datelor.

## Integrarea cu Firebase

Platforma Firebase stă la baza întregii infrastructuri de backend a aplicației.

-   **Firebase Authentication**: Gestionează întregul proces de autentificare. Suportă atât crearea de conturi prin e-mail și parolă, cât și autentificarea rapidă prin **Google OAuth**. Asigură un sistem de login securizat și eficient.
-   **Firestore Database**: Acționează ca bază de date NoSQL. Toate datele aplicației — orare, clase, profesori, materii, disponibilități și roluri (`admin`/`teacher`) — sunt stocate aici.


### Tehnologii Principale (Runtime)

Acestea sunt librăriile de care aplicația depinde pentru a funcționa:

-   **`react`** și **`react-dom`**: Pentru construirea interfeței utilizator.
-   **`react-router-dom`**: Pentru gestionarea rutelor în aplicație.
-   **`tailwindcss`**: Pentru stilizarea componentelor.
-   **`firebase`**: Pentru autentificare și baza de date în timp real.
-   **`@react-oauth/google`**: Pentru integrarea cu Google OAuth.
-   **`react-firebase-hooks`**: Hook-uri React pentru o integrare mai ușoară cu Firebase.
-   **`react-icons`**: Pentru utilizarea de iconițe vectoriale.

### Unelte de Dezvoltare

Acestea sunt pachetele folosite în timpul procesului de dezvoltare:

-   **`vite`**: Unealtă de build și server de dezvoltare.
-   **`typescript`**: Pentru adăugarea de tipuri statice în JavaScript.
-   **`eslint`**: Pentru analiza statică a codului și identificarea problemelor.
-   **`prettier`**: Pentru formatarea automată a codului.
-   **`@vitejs/plugin-react`**: Plugin oficial Vite pentru proiecte React.
-   **`@tailwindcss/vite`**: Plugin Vite pentru integrarea cu TailwindCSS.
-   **Alte pachete**: Include tipuri (`@types/*`), configurări și plugin-uri pentru ESLint și Prettier.

## Algoritmul de Generare a Orarelor

Aplicația folosește o combinație dintre un algoritm genetic ([Evolution Strategy](https://en.wikipedia.org/wiki/Evolution_strategy)) și [Simulated Annealing](https://en.wikipedia.org/wiki/Simulated_annealing) pentru a genera orare cât mai optime.

### Tipuri de constrângeri

-   **Stricte**:
    -   Profesorii nu pot fi programați la mai multe clase în același timp.
    -   Lecțiile trebuie programate în intervalul de disponibilitate al profesorilor.
    -   Nu se poate să existe spații goale între ore
-   **Flexibile**:
    -   Distribuție uniformă a lecțiilor de-a lungul săptămânii.
    -   Evitarea orelor libere la începutul zilei.
    -   Reducerea numărului de ore de același tip într-o zi

## Autori și contribuții

-   **Costan Matei Ștefan**: A lucrat la algoritmul de generare a orarelor și a contribuit la îmbunătățirea interfeței aplicației.
-   **Lungu Răzvan-Tudor**: A lucrat la interfața aplicației și s-a ocupat cu implementarea bazei de date in aplicatie.

Ambii autori sunt elevi la Colegiul Național "I. L. Caragiale" din București, sub îndrumarea profesorului coordonator Florea Andrei.

> **Notă despre utilizarea uneltelor AI**:
>
> - **Optimizarea Algoritmului**: Inteligența artificială (Claude 3.7 Sonnet) a fost folosită pentru a optimiza anumite părți ale algoritmului de generare a orarelor (funcțiile `Timetable.compactSchedule()`, `Timetable.swapWithCompatibleLesson()` și `Timetable.calculateSoftConstraintsFitness()`).
> - **Generarea Designului**: A fost utilizat [V0](https://v0.dev) pentru a genera un mock-up de design pentru interfață. Acest design a stat la baza implementării finale, fiind adoptat în urma feedback-ului primit pe o versiune inițială a design-ului.
> - **Rezolvarea Bug-urilor**: GitHub Copilot a fost folosit pentru a ușura procesul de rezolvare a bug-urilor pe parcursul dezvoltării.