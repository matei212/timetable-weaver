# Timetable Weaver

## Despre

Timetable Weaver reprezintă o soluție software de înaltă performanță dedicată instituțiilor de învățământ, concepută pentru automatizarea și optimizarea procesului complex de generare a orarelor. Această aplicație web inovatoare implementează algoritmi avansați de optimizare combinatorială pentru a elabora orare școlare care respectă toate constrângerile impuse, oferind astfel o soluție elegantă și eficientă pentru o problemă de planificare deosebit de complexă.

Dezvoltată utilizând tehnologii moderne, aplicația oferă o experiență utilizator impecabilă, facilitând administrarea resurselor educaționale într-un mod intuitiv și eficient. Sistemul nostru de algoritmi hibrizi integrează metode evolutive cu tehnici de recoacere simulată pentru a identifica soluții optime în spațiul vast al posibilităților de planificare.

## Caracteristici principale

- **Interfață utilizator intuitivă și responsivă**: Design modern care facilitează gestionarea completă a claselor, cadrelor didactice și disciplinelor academice.
- **Sistem avansat de import-export**: Interfațare cu sisteme externe prin importul datelor în format CSV și exportul orarelor generate în format PDF, gata pentru distribuire și afișare.
- **Motor de optimizare performant**: Arhitectură algoritmică bazată pe paradigme evolutive și metode de optimizare determinist-stocastice pentru generarea orarelor optimale.
- **Gestionare complexă a constrângerilor**: Sistem dual de constrângeri care asigură atât respectarea limitărilor absolute (disponibilitatea profesorilor, evitarea suprapunerilor) cât și optimizarea preferințelor (distribuția uniformă a disciplinelor, minimizarea intervalelor libere).
- **Persistența automată a datelor**: Sistem robust de salvare automată în browser pentru prevenirea pierderii informațiilor și asigurarea continuității sesiunilor de lucru.

## Ghid de utilizare detaliat

### 1. Instalare și configurare inițială

Pentru instalarea și rularea aplicației în mediul local:

```
git clone [repository-url]
npm install
npm run dev
```

După executarea acestor comenzi, aplicația va fi disponibilă în browser la adresa http://localhost:3000. Se recomandă utilizarea unei versiuni recente de Chrome, Firefox sau Edge pentru compatibilitate maximă.

### 2. Gestionarea resurselor educaționale

#### a) Configurarea cadrelor didactice
- Accesați modulul "Profesori" din meniul principal
- Utilizați butonul "Adaugă profesor" pentru înregistrarea fiecărui cadru didactic
- Completați informațiile solicitate: nume complet, specializare, grad didactic
- Definiți intervalele de disponibilitate prin selectarea celulelor în grila săptămânală (verde - disponibil, roșu - indisponibil)
- Specificați eventualele preferințe sau restricții suplimentare în secțiunea dedicată
- Salvați modificările prin apăsarea butonului "Confirmă" din partea inferioară a formularului

#### b) Definirea claselor și grupelor
- Navigați către secțiunea "Clase" din interfața principală
- Creați o clasă nouă folosind opțiunea dedicată din colțul superior-dreapt
- Specificați denumirea clasei, anul de studiu și specializarea
- Adăugați informații relevante precum dirigintele sau sala principală unde se desfășoară activitățile
- Pentru divizarea în grupe (la materiile care necesită acest lucru), utilizați funcția "Adaugă grupă" și definiți componența acesteia
- Confirmați configurația prin validarea formularului

#### c) Configurarea materiilor și alocarea profesorilor
- Accesați modulul "Lecții" din meniul principal
- Adăugați materii noi prin completarea denumirii și a numărului de ore săptămânale alocat
- Asociați fiecare materie cu profesorul corespunzător din lista disponibilă
- Specificați eventualele cerințe speciale (laboratoare, săli specializate, etc.)
- Definiți importanța materiei pentru algoritmul de optimizare (prioritate înaltă/medie/scăzută)
- Confirmați și salvați configurația

### 3. Generarea și gestionarea orarului

- Din secțiunea "Prezentare generală", inițiați procesul de generare prin acționarea butonului "Generează orar"
- Monitorizați progresul generării în indicatorul vizual dedicat
- După finalizare, evaluați calitatea soluției prezentate în interfața interactivă
- Utilizați opțiunile de filtrare pentru vizualizarea orarului pe clase, profesori sau săli
- Pentru ajustări manuale, folosiți funcția de editare prin drag-and-drop a elementelor din grilă
- Verificați automat conflictele potențiale prin intermediul instrumentului de validare
- Salvați versiuni alternative ale orarului pentru comparare ulterioară
- Finalizați procesul prin confirmarea variantei optime

### 4. Exportul și distribuirea rezultatelor

- Din modulul de prezentare, selectați opțiunea "Exportă" din meniul contextual
- Alegeți formatul dorit pentru export (PDF, HTML, CSV)
- Personalizați aspectul documentului prin opțiunile disponibile (antet, subsol, stilizare)
- Generați documentul final și salvați-l în locația preferată
- Utilizați funcția de distribuire integrată pentru trimiterea automată către destinatari predefiniți
- Programați publicarea online a orarului prin integrarea cu sistemele instituționale existente

### 5. Informații tehnice

Aplicația este dezvoltată pe baza unui stack tehnologic modern și performant:
- React pentru arhitectura frontend și experiența utilizator fluidă
- TailwindCSS pentru un design responsive și consistent
- TypeScript pentru siguranța tipurilor și prevenirea erorilor
- Vite pentru procesul de dezvoltare și compilare optimizată

Timetable Weaver constituie soluția ideală pentru instituțiile de învățământ care doresc să eficientizeze procesul administrativ de creare a orarelor, reducând semnificativ timpul necesar și eliminând potențialele conflicte de programare, contribuind astfel la optimizarea întregului proces educațional. 