/* =========================================================
   Scoop — données structurées pour « Mes concours »
   Les textes détaillés (diplôme, épreuves, oraux) restent dans data/prepa.js.
   Ici : seulement ce qu'il faut pour FILTRER et CALCULER (niveau, frais, région, dates).
   Les dates (MM-JJ) viennent de la session 2026 (L'Etudiant, 16 mars 2026), sauf mention
   `confirmed: true` (dates 2027 publiées par l'école). Elles se recalent chaque année : à reconfirmer.
   ========================================================= */
window.SCOOP_CONCOURS = {
  levels: [
    { id: 'bac', label: 'Le bac', sub: 'Terminale ou bachelier·ère' },
    { id: 'b2', label: 'Bac+2', sub: 'L2, BTS, DUT…' },
    { id: 'b3', label: 'Bac+3', sub: 'Licence, BUT 3, bachelor' },
    { id: 'b5', label: 'Bac+4/5 ou plus', sub: 'Master, école, reconversion' }
  ],
  regions: [
    { id: 'idf', label: 'Île-de-France' }, { id: 'hdf', label: 'Hauts-de-France' }, { id: 'ge', label: 'Grand Est' },
    { id: 'bre', label: 'Bretagne' }, { id: 'cvl', label: 'Centre-Val de Loire' }, { id: 'naq', label: 'Nouvelle-Aquitaine' },
    { id: 'occ', label: 'Occitanie' }, { id: 'ara', label: 'Auvergne-Rhône-Alpes' }, { id: 'paca', label: 'Provence-Alpes-Côte d\'Azur' }
  ],
  // Envies : elles servent à personnaliser ton plan et l'entretien avec le jury (pas à écarter une école)
  wishes: ['Presse écrite', 'Radio', 'Télévision', 'Vidéo & web', 'Reportage', 'Enquête', 'Data & numérique', 'International', 'Sport', 'Culture', 'Photo', 'Presse locale', 'Politique', 'Société & social', 'Environnement'],

  // entry : bac (post-bac, Parcoursup) | b2 (bac+2 accepté) | b3 (bac+3 attendu)
  // open / close : MM-JJ (open vide = date d'ouverture non connue). dossier : épreuve principale sur dossier.
  schools: {
    'CELSA':      { open: '01-06', close: '02-02', fee: 70,  entry: 'b3',  region: 'idf',  dossier: false },
    'CY Cergy':   { open: '01-27', close: '03-01', fee: 30,  entry: 'b3',  region: 'idf',  dossier: false, approx: true },
    'CFJ':        { open: '12-10', close: '03-02', fee: 299, entry: 'b3',  region: 'idf',  dossier: true, scholarship: 'Réduction de 50 % des frais pour les boursiers (selon Diplomeo)' },
    'CUEJ':       { open: '01-06', close: '01-29', fee: 99,  entry: 'b3',  region: 'ge',   dossier: false },
    'EJC Cannes': { open: '01-19', close: '03-12', fee: 0,   entry: 'bac', region: 'paca', dossier: true, platform: 'Parcoursup' },
    'EJCAM':      { open: '01-12', close: '02-09', fee: 76,  entry: 'b3',  region: 'paca', dossier: false },
    'EJDG':       { open: '01-14', close: '03-05', fee: 50,  entry: 'b3',  region: 'ara',  dossier: false },
    'EJT':        { open: '01-19', close: '03-27', fee: 100, entry: 'b2',  region: 'occ',  dossier: false },
    'EPJT':       { open: '01-05', close: '02-13', fee: 0,   entry: 'b3',  region: 'cvl',  dossier: true },
    'ESJ Lille':  { open: '11-16', close: '02-04', fee: 290, entry: 'b3',  region: 'hdf',  dossier: false, confirmed: true,
                    note: 'Dates 2027 publiées par l\'école : inscriptions du 16 novembre 2026 au 4 février 2027, dossier du 18 au 25 février, épreuves en mai.',
                    scholarship: 'Prépa égalité des chances gratuite pour les boursiers en L3 (frais de concours pris en charge)' },
    'IFP':        { open: '01-12', close: '02-25', fee: 80,  entry: 'b3',  region: 'idf',  dossier: false },
    'IJBA':       { open: '01-12', close: '03-02', fee: 75,  entry: 'b3',  region: 'naq',  dossier: false },
    'IPJ':        { open: '12-15', close: '02-23', fee: 256, entry: 'b3',  region: 'idf',  dossier: false },
    'IUT Lannion':{ open: '01-19', close: '03-12', fee: 0,   entry: 'bac', region: 'bre',  dossier: true, platform: 'Parcoursup' },
    'Sciences Po':{ open: '',      close: '01-11', fee: 150, entry: 'b3',  region: 'idf',  dossier: true },
    'Metz':       { open: '02-17', close: '03-16', fee: 0,   entry: 'b3',  region: 'ge',   dossier: true, platform: 'Mon Master' }
  },

  // Aides pour les boursier·ères (chaque ligne a sa source)
  aides: [
    { title: 'Prépa égalité des chances de l\'ESJ Lille', text: 'Gratuite, réservée aux étudiant·es boursier·ères inscrit·es en L3 ; l\'école prend en charge les frais de concours et de déplacement (d\'après l\'Onisep).', url: 'https://www.onisep.fr/ressources/structures-enseignement/hauts-de-france/nord/ecole-superieure-de-journalisme-de-lille-universite-de-lille/classe-preparatoire-egalite-des-chances-aux-concours-des-ecoles-de-journalisme', source: 'Onisep' },
    { title: 'La Chance, pour la diversité dans les médias', text: 'Une association qui propose un accompagnement gratuit aux boursier·ères qui préparent les concours (mentorat par des journalistes, dans plusieurs grandes villes).', url: 'https://www.letudiant.fr/etudes/ecoles-specialisees/mixite-sociale-la-chance-pour-la-diversite-dans-les-medias-a-l-assaut-des-ecoles-de-journalisme.html', source: 'L\'Etudiant' },
    { title: 'Frais de concours réduits', text: 'Le CFJ accorde 50 % de réduction aux boursier·ères (selon Diplomeo). Demande toujours le tarif boursier à chaque école avant de payer.', url: 'https://diplomeo.com/actualite-concours_ecoles_journalisme', source: 'Diplomeo' }
  ]
};
