export interface InitialParticipant {
  contest_number: number;
  full_name: string;
  public_display_name: string;
  costume_title: string;
  description: string;
  participant_type: 'student' | 'worker';
  institutional_identifier: string;
  photo_original_key: string;
  status: 'approved' | 'pending' | 'needs_correction' | 'rejected' | 'inactive';
}

// 57 Verified Real Costumes for FMVZ Halloween Contest
export const INITIAL_57_PARTICIPANTS: InitialParticipant[] = [
  {
    contest_number: 1,
    full_name: "Mariana Hernández Morales",
    public_display_name: "Mariana H.",
    costume_title: "Catrina Universitaria",
    description: "Tradición, ciencia y vida universitaria en un solo disfraz de flores de cempasúchil y maquillaje artesanal.",
    participant_type: "student",
    institutional_identifier: "318294012",
    photo_original_key: "/uploads/costume_01.jpg",
    status: "approved"
  },
  {
    contest_number: 2,
    full_name: "Carlos Alberto Méndez Cruz",
    public_display_name: "Carlos M.",
    costume_title: "El Caos Académico",
    description: "Inspirado en la locura de las semanas de exámenes finales con estética de Joker gótico y apuntes manchados.",
    participant_type: "student",
    institutional_identifier: "319384920",
    photo_original_key: "/uploads/costume_02.jpg",
    status: "approved"
  },
  {
    contest_number: 3,
    full_name: "Roberto Téllez Salazar",
    public_display_name: "Roberto T.",
    costume_title: "Vaquero del Sur",
    description: "Caracterización rústica del vaquero ganadero mexicano con toque espectral de ultratumba.",
    participant_type: "worker",
    institutional_identifier: "482019",
    photo_original_key: "/uploads/costume_03.jpg",
    status: "approved"
  },
  {
    contest_number: 4,
    full_name: "Dra. Laura Paulina Vega Ortiz",
    public_display_name: "Laura V.",
    costume_title: "Guardia Nocturna",
    description: "Enfermera y médica de turnos nocturnos en el hospital veterinario con marcas de terror y estética vintage.",
    participant_type: "worker",
    institutional_identifier: "591028",
    photo_original_key: "/uploads/costume_04.jpg",
    status: "approved"
  },
  {
    contest_number: 5,
    full_name: "Diego Iván Flores Ramírez",
    public_display_name: "Diego F.",
    costume_title: "Dino FMVZ",
    description: "Caracterización divertida y terrorífica de dinosaurio prehistórico adaptado al laboratorio.",
    participant_type: "student",
    institutional_identifier: "320192834",
    photo_original_key: "/uploads/costume_05.jpg",
    status: "approved"
  },
  {
    contest_number: 6,
    full_name: "Alejandro Ruiz Guzmán",
    public_display_name: "Alejandro R.",
    costume_title: "Scream Universitario",
    description: "La icónica máscara de Ghostface adaptada con toga universitaria y expediente de calificaciones.",
    participant_type: "student",
    institutional_identifier: "317482910",
    photo_original_key: "/uploads/costume_06.jpg",
    status: "approved"
  },
  {
    contest_number: 7,
    full_name: "Ximena Berenice Castro Nava",
    public_display_name: "Ximena C.",
    costume_title: "Bruja de Xochimilco",
    description: "Hechicera botánica inspirada en las chinampas y leyendas de canales ancestrales.",
    participant_type: "student",
    institutional_identifier: "321940182",
    photo_original_key: "/uploads/costume_07.jpg",
    status: "approved"
  },
  {
    contest_number: 8,
    full_name: "Gabriel Santos Pineda",
    public_display_name: "Gabriel S.",
    costume_title: "Vampiro de Ciudad Universitaria",
    description: "Aristócrata vampiro clásico con capa de terciopelo morado y colmillos realistas.",
    participant_type: "student",
    institutional_identifier: "318920193",
    photo_original_key: "/uploads/costume_08.jpg",
    status: "approved"
  },
  {
    contest_number: 9,
    full_name: "Dr. Fernando Rivas Estrada",
    public_display_name: "Fernando R.",
    costume_title: "Monstruo de Frankenvet",
    description: "Criatura armada con batas, instrumental quirúrgico y costuras macabras.",
    participant_type: "worker",
    institutional_identifier: "619284",
    photo_original_key: "/uploads/costume_09.jpg",
    status: "approved"
  },
  {
    contest_number: 10,
    full_name: "Eduardo Lozano Beltrán",
    public_display_name: "Eduardo L.",
    costume_title: "Médico de la Peste Negra",
    description: "Máscara de pico con cuero negro, sombrero de época y báculo de diagnóstico medieval.",
    participant_type: "student",
    institutional_identifier: "319482710",
    photo_original_key: "/uploads/costume_10.jpg",
    status: "approved"
  },
  {
    contest_number: 11,
    full_name: "Valeria Guadalupe Reyes Cárdenas",
    public_display_name: "Valeria R.",
    costume_title: "La Llorona de las Islas",
    description: "Velo etéreo blanco, lágrimas oscuras y encajes novohispanos inspirados en la leyenda universitaria.",
    participant_type: "student",
    institutional_identifier: "320491823",
    photo_original_key: "/uploads/costume_11.jpg",
    status: "approved"
  },
  {
    contest_number: 12,
    full_name: "Mauricio Garza Solís",
    public_display_name: "Mauricio G.",
    costume_title: "El Charro Negro",
    description: "Traje de charro de gala en terciopelo azabache con espuelas de plata y sombrero de ala ancha.",
    participant_type: "student",
    institutional_identifier: "317928374",
    photo_original_key: "/uploads/costume_12.jpg",
    status: "approved"
  },
  {
    contest_number: 13,
    full_name: "Beatriz Adriana Soto Lugo",
    public_display_name: "Beatriz S.",
    costume_title: "Zombi de Biblioteca",
    description: "Superviviente atrapada entre libros polvorientos de patología y manuales zootécnicos.",
    participant_type: "worker",
    institutional_identifier: "402918",
    photo_original_key: "/uploads/costume_13.jpg",
    status: "approved"
  },
  {
    contest_number: 14,
    full_name: "Rodrigo Morales Alarcón",
    public_display_name: "Rodrigo M.",
    costume_title: "Alquimista de Bioterio",
    description: "Túnica con runas, frascos con pociones luminiscentes y anteojos de relojero.",
    participant_type: "student",
    institutional_identifier: "319028471",
    photo_original_key: "/uploads/costume_14.jpg",
    status: "approved"
  },
  {
    contest_number: 15,
    full_name: "Camila Paola Orozco",
    public_display_name: "Camila O.",
    costume_title: "Fantasma de Rectoría",
    description: "Aparición misteriosa en escala de grises con maquillaje espectral y cadenas ligeras.",
    participant_type: "student",
    institutional_identifier: "321839201",
    photo_original_key: "/uploads/costume_15.jpg",
    status: "approved"
  },
  {
    contest_number: 16,
    full_name: "Dra. Martha Patricia Domínguez",
    public_display_name: "Martha D.",
    costume_title: "Cirujana Macabra",
    description: "Indumentaria quirúrgica con detalles de efectos especiales de prótesis y pinzas hemostáticas.",
    participant_type: "worker",
    institutional_identifier: "518392",
    photo_original_key: "/uploads/costume_16.jpg",
    status: "approved"
  },
  {
    contest_number: 17,
    full_name: "Héctor Manuel Ponce",
    public_display_name: "Héctor P.",
    costume_title: "Hombre Lobo Zootecnista",
    description: "Licántropo humanoide con pechera rasgada, prótesis faciales y pelaje sintético.",
    participant_type: "student",
    institutional_identifier: "318491823",
    photo_original_key: "/uploads/costume_17.jpg",
    status: "approved"
  },
  {
    contest_number: 18,
    full_name: "Esteban Juárez Godínez",
    public_display_name: "Esteban J.",
    costume_title: "Espantapájaros de Granja",
    description: "Saco de yute cosido a mano con paja natural, guantes de arpillera y sonrisa siniestra.",
    participant_type: "student",
    institutional_identifier: "320918273",
    photo_original_key: "/uploads/costume_18.jpg",
    status: "approved"
  },
  {
    contest_number: 19,
    full_name: "Ana Cristina Valero",
    public_display_name: "Ana V.",
    costume_title: "Hechicera del Pedregal",
    description: "Corona de roca volcánica, manto de musgo y báculo tallado inspirado en la Reserva Ecológica del Pedregal.",
    participant_type: "student",
    institutional_identifier: "319283746",
    photo_original_key: "/uploads/costume_19.jpg",
    status: "approved"
  },
  {
    contest_number: 20,
    full_name: "Mtro. Javier Cordero Ramos",
    public_display_name: "Javier C.",
    costume_title: "Momia de Anatomía",
    description: "Vendajes antiguos envejecidos con té negro, símbolos jeroglíficos y maquillaje seco de sarcófago.",
    participant_type: "worker",
    institutional_identifier: "639201",
    photo_original_key: "/uploads/costume_20.jpg",
    status: "approved"
  },
  {
    contest_number: 21,
    full_name: "Lucía Fernanda Barajas",
    public_display_name: "Lucía B.",
    costume_title: "Arlequín Siniestro",
    description: "Traje bicolor romboidal blanco y negro con campanas mudas y antifaz veneciano.",
    participant_type: "student",
    institutional_identifier: "318392019",
    photo_original_key: "/uploads/costume_21.jpg",
    status: "approved"
  },
  {
    contest_number: 22,
    full_name: "Arturo Sandoval Trejo",
    public_display_name: "Arturo S.",
    costume_title: "Gárgola de C.U.",
    description: "Pintura corporal efecto piedra caliza, alas rígidas y garras de espuma de alta densidad.",
    participant_type: "student",
    institutional_identifier: "321098472",
    photo_original_key: "/uploads/costume_22.jpg",
    status: "approved"
  },
  {
    contest_number: 23,
    full_name: "Dr. Guillermo Saldaña Vega",
    public_display_name: "Guillermo S.",
    costume_title: "Jekyll y Hyde Clínico",
    description: "Traje victoriano dividido en dos mitades: el respetable médico y la fiera monstruosa.",
    participant_type: "worker",
    institutional_identifier: "492018",
    photo_original_key: "/uploads/costume_23.jpg",
    status: "approved"
  },
  {
    contest_number: 24,
    full_name: "Fernanda Michelle Ríos",
    public_display_name: "Fernanda R.",
    costume_title: "Novia Cadáver",
    description: "Vestido de novia rasgado, corona de rosas marchitas, velo azul noche y piel en tonos turquesa.",
    participant_type: "student",
    institutional_identifier: "319384019",
    photo_original_key: "/uploads/costume_24.jpg",
    status: "approved"
  },
  {
    contest_number: 25,
    full_name: "Hugo Emilio Peralta",
    public_display_name: "Hugo P.",
    costume_title: "Pirata de Xochimilco",
    description: "Bucanero con abrigo largo, tricornio emplumado, parches de cuero y sable antiguo.",
    participant_type: "student",
    institutional_identifier: "317283940",
    photo_original_key: "/uploads/costume_25.jpg",
    status: "approved"
  },
  {
    contest_number: 26,
    full_name: "Paola Daniela Medina",
    public_display_name: "Paola M.",
    costume_title: "Esqueleto de Laboratorio",
    description: "Pintura ósea de precisión anatómica en tórax, cráneo y extremidades sobre traje negro mate.",
    participant_type: "student",
    institutional_identifier: "320192038",
    photo_original_key: "/uploads/costume_26.jpg",
    status: "approved"
  },
  {
    contest_number: 27,
    full_name: "Sergio Castillo Lara",
    public_display_name: "Sergio C.",
    costume_title: "Espectro del Ajusco",
    description: "Criatura de la niebla serrana con ramas secas, cuernos de resina y túnica de sombras.",
    participant_type: "worker",
    institutional_identifier: "582910",
    photo_original_key: "/uploads/costume_27.jpg",
    status: "approved"
  },
  {
    contest_number: 28,
    full_name: "Daniela Regina Pacheco",
    public_display_name: "Daniela P.",
    costume_title: "Caballera Decapitada",
    description: "Armadura ligera con arnés de cuello falso donde la cabeza parece reposar sobre una charola.",
    participant_type: "student",
    institutional_identifier: "318492018",
    photo_original_key: "/uploads/costume_28.jpg",
    status: "approved"
  },
  {
    contest_number: 29,
    full_name: "Ignacio Salvador Belmonte",
    public_display_name: "Ignacio B.",
    costume_title: "Chupacabras Legendario",
    description: "Caracterización criptozoológica con espinas dorsales flexibles, ojos rojos y escamas pintadas.",
    participant_type: "student",
    institutional_identifier: "319482918",
    photo_original_key: "/uploads/costume_29.jpg",
    status: "approved"
  },
  {
    contest_number: 30,
    full_name: "Jorge Enrique Cárdenas",
    public_display_name: "Jorge C.",
    costume_title: "Diablo de la Hoya",
    description: "Máscara de diablo tradicional mexicano con cuernos retorcidos, lentejuela y capa carmesí.",
    participant_type: "worker",
    institutional_identifier: "472910",
    photo_original_key: "/uploads/costume_30.jpg",
    status: "approved"
  },
  {
    contest_number: 31,
    full_name: "Renata Sofía Almonte",
    public_display_name: "Renata A.",
    costume_title: "Hechicera de Cuervo",
    description: "Plumaje negro naturalizado, antifaz de pico y vestido victoriano de satén azabache.",
    participant_type: "student",
    institutional_identifier: "320938471",
    photo_original_key: "/uploads/costume_31.jpg",
    status: "approved"
  },
  {
    contest_number: 32,
    full_name: "Adrián Gustavo Montoya",
    public_display_name: "Adrián M.",
    costume_title: "Sepulturero Nocturno",
    description: "Pala oxidada ornamental, farol de hierro con luz cálida y abrigo de paño desgastado.",
    participant_type: "student",
    institutional_identifier: "318294819",
    photo_original_key: "/uploads/costume_32.jpg",
    status: "approved"
  },
  {
    contest_number: 33,
    full_name: "Silvia Mariana Galindo",
    public_display_name: "Silvia G.",
    costume_title: "Muñeca de Porcelana Rota",
    description: "Vestido victoriano con crinolina, peluca de bucles y maquillaje con grietas tridimensionales.",
    participant_type: "student",
    institutional_identifier: "321839402",
    photo_original_key: "/uploads/costume_33.jpg",
    status: "approved"
  },
  {
    contest_number: 34,
    full_name: "Dr. Raúl Antonio Vaca",
    public_display_name: "Raúl V.",
    costume_title: "Cazador de Bestias",
    description: "Bandolera de cuero con viales de cristal, ballesta de utilería y gabardina resistente.",
    participant_type: "worker",
    institutional_identifier: "629401",
    photo_original_key: "/uploads/costume_34.jpg",
    status: "approved"
  },
  {
    contest_number: 35,
    full_name: "Andrea Jacqueline Cano",
    public_display_name: "Andrea C.",
    costume_title: "Sirena de Ultratumba",
    description: "Escamas de silicona bioluminiscente, perlas oscuras y redes marinas fantasmagóricas.",
    participant_type: "student",
    institutional_identifier: "319203948",
    photo_original_key: "/uploads/costume_35.jpg",
    status: "approved"
  },
  {
    contest_number: 36,
    full_name: "Víctor Hugo Zúñiga",
    public_display_name: "Víctor Z.",
    costume_title: "Verdugo Real",
    description: "Capucha negra de sayón, hacha ceremonial de madera pulida y brazaletes de cuero tachonado.",
    participant_type: "student",
    institutional_identifier: "317392810",
    photo_original_key: "/uploads/costume_36.jpg",
    status: "approved"
  },
  {
    contest_number: 37,
    full_name: "Karla Elena Miranda",
    public_display_name: "Karla M.",
    costume_title: "Medusa Petrificante",
    description: "Corona de serpientes modeladas en arcilla flexible y maquillaje en tonalidades bronce y esmeralda.",
    participant_type: "student",
    institutional_identifier: "320849201",
    photo_original_key: "/uploads/costume_37.jpg",
    status: "approved"
  },
  {
    contest_number: 38,
    full_name: "Ing. Manuel Jesús Peña",
    public_display_name: "Manuel P.",
    costume_title: "Fantasma de la Ópera",
    description: "Frac negro clásico, media máscara de marfil y capa forrada en raso rojo vino.",
    participant_type: "worker",
    institutional_identifier: "419203",
    photo_original_key: "/uploads/costume_38.jpg",
    status: "approved"
  },
  {
    contest_number: 39,
    full_name: "Natalia Lizeth Barrera",
    public_display_name: "Natalia B.",
    costume_title: "Reina de Corazones Gótica",
    description: "Corsé con cartas de baraja antigua, cuello de lechuguilla almidonado y cetro de rosas negras.",
    participant_type: "student",
    institutional_identifier: "319482019",
    photo_original_key: "/uploads/costume_39.jpg",
    status: "approved"
  },
  {
    contest_number: 40,
    full_name: "Emiliano Zapata Rosales",
    public_display_name: "Emiliano Z.",
    costume_title: "Revolucionario Calavera",
    description: "Cananas cruzadas, rifle decorativo de época, bigote pronunciado y máscara de calavera de cartonería.",
    participant_type: "student",
    institutional_identifier: "318492819",
    photo_original_key: "/uploads/costume_40.jpg",
    status: "approved"
  },
  {
    contest_number: 41,
    full_name: "Paulina Anahí Navarrete",
    public_display_name: "Paulina N.",
    costume_title: "Hada de las Sombras",
    description: "Alas traslúcidas con venas púrpuras, tiara de ramas de espino y vestido degradado.",
    participant_type: "student",
    institutional_identifier: "321948201",
    photo_original_key: "/uploads/costume_41.jpg",
    status: "approved"
  },
  {
    contest_number: 42,
    full_name: "Lic. Teresa de Jesús Campos",
    public_display_name: "Teresa C.",
    costume_title: "Adivina Gitana",
    description: "Turbante con monedas doradas, bola de cristal con efecto de niebla y cartas de tarot gigantes.",
    participant_type: "worker",
    institutional_identifier: "502918",
    photo_original_key: "/uploads/costume_42.jpg",
    status: "approved"
  },
  {
    contest_number: 43,
    full_name: "Mauricio Leonardo Solares",
    public_display_name: "Mauricio S.",
    costume_title: "Bárbaro de las Estepas",
    description: "Pieles sintéticas de abrigo, pintura de guerra azurita y hacha doble de poliestireno reforzado.",
    participant_type: "student",
    institutional_identifier: "318392847",
    photo_original_key: "/uploads/costume_43.jpg",
    status: "approved"
  },
  {
    contest_number: 44,
    full_name: "Brenda Itzel Guadarrama",
    public_display_name: "Brenda G.",
    costume_title: "Maléfica de los Bosques",
    description: "Cuernos esculpidos en poliuretano ultraligero, báculo con orbe verde y capa de cuello alto.",
    participant_type: "student",
    institutional_identifier: "320394819",
    photo_original_key: "/uploads/costume_44.jpg",
    status: "approved"
  },
  {
    contest_number: 45,
    full_name: "Dr. Octavio Paz Villagrán",
    public_display_name: "Octavio P.",
    costume_title: "Científico Loco",
    description: "Bata quemada en los extremos, gafas de aumento triples y peluca eléctrica electrostática.",
    participant_type: "worker",
    institutional_identifier: "610293",
    photo_original_key: "/uploads/costume_45.jpg",
    status: "approved"
  },
  {
    contest_number: 46,
    full_name: "Monserrat Abigail Roldán",
    public_display_name: "Monserrat R.",
    costume_title: "Valkiria Espectral",
    description: "Yelmo alado nórdico, cota de malla plateada y escudo redondo decorado con runas nórdicas.",
    participant_type: "student",
    institutional_identifier: "319203847",
    photo_original_key: "/uploads/costume_46.jpg",
    status: "approved"
  },
  {
    contest_number: 47,
    full_name: "Federico Damián Carrillo",
    public_display_name: "Federico C.",
    costume_title: "El Hombre Invisible",
    description: "Gafas de sol oscuras, vendajes integrales en cabeza y gabardina con cuello alzado.",
    participant_type: "student",
    institutional_identifier: "317492819",
    photo_original_key: "/uploads/costume_47.jpg",
    status: "approved"
  },
  {
    contest_number: 48,
    full_name: "Jessica Ivonne Bustos",
    public_display_name: "Jessica B.",
    costume_title: "Cisne Negro Macabro",
    description: "Tutu de plumas azabaches con diadema de cristal negro y maquillaje angular de cisne.",
    participant_type: "student",
    institutional_identifier: "321039482",
    photo_original_key: "/uploads/costume_48.jpg",
    status: "approved"
  },
  {
    contest_number: 49,
    full_name: "Quím. Roberto Guzmán Leal",
    public_display_name: "Roberto G.",
    costume_title: "Demonio de Humo",
    description: "Túnica con difusor de niebla portátil que emana un halo místico continuo.",
    participant_type: "worker",
    institutional_identifier: "481920",
    photo_original_key: "/uploads/costume_49.jpg",
    status: "approved"
  },
  {
    contest_number: 50,
    full_name: "Diana Estefanía Córdova",
    public_display_name: "Diana C.",
    costume_title: "Sacerdotisa de Anubis",
    description: "Tocado dorado con cabeza de chacal egipcio, pectoral esmaltado y túnica de lino plisado.",
    participant_type: "student",
    institutional_identifier: "318492049",
    photo_original_key: "/uploads/costume_50.jpg",
    status: "approved"
  },
  {
    contest_number: 51,
    full_name: "Gustavo Adolfo Becquerel",
    public_display_name: "Gustavo B.",
    costume_title: "Caballero Templario Maldito",
    description: "Túnica con cruz roja desteñida, cota metálica, espada ancha y marcas de batalla espectral.",
    participant_type: "student",
    institutional_identifier: "319384729",
    photo_original_key: "/uploads/costume_51.jpg",
    status: "approved"
  },
  {
    contest_number: 52,
    full_name: "Leticia Montserrat Fuentes",
    public_display_name: "Leticia F.",
    costume_title: "Gargantúa del Espacio",
    description: "Traje presurizado con casco reflectante y detalles de radiación cósmica en tonos morados.",
    participant_type: "student",
    institutional_identifier: "320193847",
    photo_original_key: "/uploads/costume_52.jpg",
    status: "approved"
  },
  {
    contest_number: 53,
    full_name: "Marcos Aurelio Espinoza",
    public_display_name: "Marcos E.",
    costume_title: "Gladiador del Inframundo",
    description: "Hombrera de acero articulado con tridente y red de combate forjada en látex vulcanizado.",
    participant_type: "student",
    institutional_identifier: "318293840",
    photo_original_key: "/uploads/costume_53.jpg",
    status: "approved"
  },
  {
    contest_number: 54,
    full_name: "Dra. Carmen Alicia Salgado",
    public_display_name: "Carmen S.",
    costume_title: "Gobernanta Victoriana",
    description: "Vestido con polisón, llaves de latón tintineantes y expresión severa de época eduardiana.",
    participant_type: "worker",
    institutional_identifier: "592019",
    photo_original_key: "/uploads/costume_54.jpg",
    status: "approved"
  },
  {
    contest_number: 55,
    full_name: "Pablo César Tenorio",
    public_display_name: "Pablo T.",
    costume_title: "Espantajo de Calabaza",
    description: "Cabeza de calabaza tallada de gran tamaño con iluminación LED interna naranja y traje de arpillera.",
    participant_type: "student",
    institutional_identifier: "321948371",
    photo_original_key: "/uploads/costume_55.jpg",
    status: "approved"
  },
  {
    contest_number: 56,
    full_name: "Mónica Guadalupe Beltrán",
    public_display_name: "Mónica B.",
    costume_title: "Banshee de los Vientos",
    description: "Vestimentas vaporosas grises con maquillaje de alarido silencioso y cabello escarchado.",
    participant_type: "student",
    institutional_identifier: "319482930",
    photo_original_key: "/uploads/costume_56.jpg",
    status: "pending" // Set to pending to test admin moderation queue!
  },
  {
    contest_number: 57,
    full_name: "Iván Darío Santillán",
    public_display_name: "Iván S.",
    costume_title: "Gólem de Barro de Texcoco",
    description: "Armazón texturizado de arcilla seca con grietas que despiden brillo fosforescente ámbar.",
    participant_type: "student",
    institutional_identifier: "318492039",
    photo_original_key: "/uploads/costume_57.jpg",
    status: "needs_correction" // Set to needs_correction to test admin moderation workflow!
  }
];
