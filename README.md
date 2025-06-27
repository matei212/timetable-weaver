# Timetable Weaver - Descriere

Timetable Weaver este o aplicație web modernă și eficientă, concepută pentru generarea automată a orarelor școlare. Aplicația folosește algoritmi avansați de optimizare pentru a crea orare care respectă toate constrângerile necesare, oferind o soluție elegantă pentru o problemă complexă de planificare.

Poate fi accesat aici: https://timetable-weaver.vercel.app/

## Caracteristici principale

- **Interfață intuitivă**: Interfață prietenoasă care permite gestionarea claselor, profesorilor și lecțiilor.
- **Import și export de date**: Posibilitatea de a importa date în format CSV și de a exporta orarele generate în format PDF.
- **Algoritm avansat de optimizare**: Utilizează o combinație inovatoare între algoritmi genetici și simulare de recoacere pentru a genera orare optimale.
- **Gestionare constrângeri**: Respectă atât constrângeri stricte (profesori care nu pot fi programați simultan la mai multe clase, disponibilitatea profesorilor), cât și constrângeri flexibile (distribuția uniformă a lecțiilor, evitarea orelor libere).
- **Salvare automată**: Datele introduse sunt salvate automat în browser pentru a preveni pierderea informațiilor.

## Cum să utilizați aplicația

1. **Instalare și pornire**:

   ```
   git clone [repository-url]
   npm install
   npm run dev
   ```

   Aplicația va fi disponibilă la adresa http://localhost:3000.

2. **Configurarea datelor**:

   - Accesați secțiunea "Profesori" pentru a adăuga și configura disponibilitatea profesorilor
   - Accesați secțiunea "Clase" pentru a defini clasele și a adăuga elevii
   - În secțiunea "Lecții" configurați materiile și alocați profesorii pentru fiecare clasă

3. **Generarea orarului**:

   - Accesați secțiunea "Prezentare generală" și utilizați butonul "Generează orar"
   - Algoritmul va procesa toate constrângerile și va genera un orar optim
   - Puteți vizualiza orarul și îl puteți ajusta după necesitate

4. **Exportarea rezultatelor**:

   - După ce sunteți mulțumiți de orar, acesta poate fi exportat în format PDF
   - Orarul poate fi distribuit profesorilor și elevilor

5. **Tehnologii utilizate**:
   - React pentru interfața utilizator
   - TailwindCSS pentru stilizare
   - TypeScript pentru siguranța tipurilor
   - Vite pentru procesul de dezvoltare și compilare

Timetable Weaver reprezintă soluția ideală pentru instituțiile de învățământ care doresc să automatizeze și să optimizeze procesul de creare a orarelor, reducând timpul necesar și eliminând conflictele de programare.

## Algoritmul de Generare a Orarelor

Aplicația folosește o combinație dintre un algoritm genetic ([ES](https://en.wikipedia.org/wiki/Evolution_strategy)) și [annealing](https://en.wikipedia.org/wiki/Simulated_annealing) pentru a genera orare cât mai optime.

Există 2 tipuri de constrângeri: stricte și flexibile
Constrângeri stricte:

- Profesorii nu pot fi programați pentru mai multe clase in același timp
- Lecțiile trebuie programate în intervalul de disponibilitate al profesorilor

Constrângeri ușoare:

- Distribuție uniformă a lecțiilor de-a lungul săptămânii
- Fără ore libere la începutul zilei

Resurse externe:
- Vite
- React
- React Router
- Tailwindcss
- Prettier
- ESlint


## Autori și contribuții

- Costan Matei Ștefan - a lucrat la algorimtul de generare al orarelor și a ajutat la inbunatațirea interfața aplicației
- Lungu Răzvan-Tudor - a lucrat la interfața aplicației și a ajutat la creearea algorimtului de generare

Ambii autori sunt elevi la Colegiul Național I. L. Caragiale din București, sub îndrumarea profesorului coordonator Florea Andrei.

_Nota: Inteligența artificială(Claude 3.7 sonnet) a fost folosită pentru a găsi metode de a optimiza codul sursă al algrotimului de generare al orarelor (functile Timetable.compactSchedule(), Timetable.swapWithCompatibleLesson() si Timetable.calculateSoftConstraintsFitness() au fost scrise cu ajutorul inteligentei artificiale)_
