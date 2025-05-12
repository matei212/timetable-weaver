# Timetable Weaver

O aplicație web pentru generarea orarelor școlare.

## Caracteristici

- Crearea claselor, profesorilor și a lecților
- Importarea datelor sub forma de CSV
- Generarea orarelor optimizate
- Exportarea orarelor în format PDF

## Tehnologii folosite

- [React](https://react.dev/) - pentru frontend
- [TailwindCSS](https://tailwindcss.com/) - pentru stilizare
- [TypeScript](https://www.typescriptlang.org/) - limbajul de programare folosit
- [Vite](https://vite.dev/) - instrumentl folosit pentru build

## Cum să începeți

### Instalare

1. Clonați repository-ul

```sh
git clone
```

2. Instalați dependențele necesare:

```sh
  npm install
```

### Rularea Serverului

```sh
npm run dev
```

Aceasta va porni serverul de dezvoltare la adresa http://localhost:3000.

### Pentru a compila proiectul pentru producție folosiți

```
npm run build
```

## Algoritmul de Generare a Orarelor

Aplicația folosește o combinație dintre un algoritm genetic ([ES](https://en.wikipedia.org/wiki/Evolution_strategy)) și [annealing](https://en.wikipedia.org/wiki/Simulated_annealing) pentru a genera orare cât mai optime.

Există 2 tipuri de constrângeri: stricte și flexibile
Constrângeri stricte:

- Profesorii nu pot fi programați pentru mai multe clase in același timp
- Lecțiile trebuie programate în intervalul de disponibilitate al profesorilor

Constrângeri ușoare:

- Distribuție uniformă a lecțiilor de-a lungul săptămânii
- Fără ore libere la începutul zilei
