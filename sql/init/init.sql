--
-- PostgreSQL database dump
--

-- Dumped from database version 11.3
-- Dumped by pg_dump version 11.3

-- Started on 2019-09-20 16:10:22

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- TOC entry 197 (class 1259 OID 16477)
-- Name: licence; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.licence (
    id integer NOT NULL,
    "licenceNumber" character varying,
    nom character varying,
    prenom character varying,
    genre character varying,
    club character varying,
    dept character varying,
    age character varying,
    catea character varying,
    catev character varying
);


ALTER TABLE public.licence OWNER TO postgres;

--
-- TOC entry 196 (class 1259 OID 16475)
-- Name: licence_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.licence_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.licence_id_seq OWNER TO postgres;

--
-- TOC entry 2817 (class 0 OID 0)
-- Dependencies: 196
-- Name: licence_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.licence_id_seq OWNED BY public.licence.id;


--
-- TOC entry 2686 (class 2604 OID 16480)
-- Name: licence id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.licence ALTER COLUMN id SET DEFAULT nextval('public.licence_id_seq'::regclass);


--
-- TOC entry 2811 (class 0 OID 16477)
-- Dependencies: 197
-- Data for Name: licence; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.licence (id, "licenceNumber", nom, prenom, genre, club, dept, age, catea, catev) FROM stdin;
7197	\N	ABADIE	Christian	H	Association Cycliste Le Fousseret	31	1959	A	5
7198	\N	ALCOUFFE	Michel	H	Team Exper'Cycle	82	\N	0	5
7199	\N	ALLARD	Yann	H	NL	81	\N	0	NL
7200	\N	ALLIX	David	H	Cyclo-Club Castanéen	31	1967	SV	4
7201	\N	ALMANSA	Carla	F	Cercle Athlétique Castelsarrasinois Cyclisme	82	2005	FM	NL
7202	\N	ALMANSA	Clément	H	Cercle Athlétique Castelsarrasinois Cyclisme	82	2001	J	NL
7203	\N	ALMANSA	Julien	H	Cercle Athlétique Castelsarrasinois Cyclisme	82	1972	V	NL
7204	\N	ABGRALL	Romain	H	Saint-Gaudens Cyclisme Comminges	31	2002	J	NL
7205	\N	ABADIE	Ugo	H	Saint-Gaudens Cyclisme Comminges	31	2002	J	NL
7206	\N	ADAGAS	Julien	H	Amicale Cycliste Tournefeuille	31	1982	S	4
7207	\N	AGUILAR	Georges	H	Vélo-Club les 3 C	30	\N	0	5
7208	\N	ALBAR	Jérôme	H	Empalot Vélo-Club	31	1979	V	4
7209	\N	AIROLDI	Laurent	H	Vélo-Club Mauvezinois	32	1972	V	3
7210	\N	ALVERNHE	Jérôme	H	Association Sportive et Culturelle Gagnac Cyclisme	31	1968	SV	5
7211	\N	AMADIS	Fabris	H	Comité FSGT 31	31	1957	A	5
7212	\N	ALBUGUES	Didier	H	TOAC Cyclisme	31	1965	SV	3
7213	\N	ANDRIEU	Philippe	H	Saint-Juéry Olympique Cyclisme	81	1962	SV	5
7214	\N	AMBLARD	Nicolas	H	Union Vélocipédique Mazamétaine	81	1979	V	NL
7215	\N	ALAUZY	Thierry	H	Association Foyer Jeunes Education	9	\N	0	NL
7216	\N	ANDORRA	Patrick	H	Empalot Vélo-Club	31	1965	SV	4
7218	\N	ANE	Alain	H	Association Cycliste Le Fousseret	31	1965	SV	4
7217	\N	AJATES	Patrick	H	Montréjeau Cyclo-Club	31	\N	0	NL
7219	\N	ANGLADE	Francis	H	Union Sportive Castelsagrat Cyclisme	82	1952	A	5
7220	\N	ANSEUR	Michel	H	Comité FSGT 31	31	1961	SV	4
7221	\N	ANTUNES	Renaud	H	Union Vélocipédique Mazamétaine	81	1988	S	NL
7222	\N	ARANGUENA	Thomas	H	TOAC Cyclisme	31	1987	S	4
7223	\N	ARBUS	Thibault	H	Union Sportive Castelsagrat Cyclisme	82	\N	0	3
7224	\N	ARMERO	Christophe	H	Association Sportive Carcassonne Cyclisme	11	\N	0	3
7225	\N	ARGANS	Philippe	H	Centre Sportif Omnisports Ariègeois 09	9	\N	0	2
7226	\N	ARIAS	David	H	Association Sportive des Autobus Toulousains	31	1975	V	4
7227	\N	ARIAS	Stéphane	H	Plaisance du Touch Amicale Cyclisme	31	1972	V	4
7228	\N	ARIAS	Thierry	H	Association Sportive Muret Cyclisme	31	1967	SV	NL
7229	\N	ARNAUD	Raphaël	H	Béziers Méditerranée Cyclisme	34	\N	0	4
7230	\N	ARTIGUE	Alain	H	TOAC Cyclisme	31	1960	SV	5
7231	\N	ASTOUL	Thomas	H	Comité FSGT 31	31	1998	E	3
7232	\N	AUBERT	Gilles	H	Balma Vélo-Sprint	31	1966	SV	5
7233	\N	AUBRY	Cyril	H	Cyclo-Club Castanéen	31	1976	V	3
7234	\N	AUDERAND	Ludovic	H	Revel Sprinter-Club	31	1979	V	4
7235	\N	AUDIGIE	Gilles	H	Cercle Athlétique Castelsarrasinois Cyclisme	82	\N	0	2
7236	\N	AUGUSTIN	Philippe	H	Comité Départemental 32	32	1951	A	NL
7237	\N	AURIOL	Olivier	H	Sorèze Vélo-Club	81	1975	V	3
7238	\N	AUTEM	Philippe	H	Club Cycliste Le Boulou	66	1966	SV	4
7239	\N	AUTIERE	David	H	Amicale Cycliste Tournefeuille	31	1983	S	4
7240	\N	AZAM	Serge	H	Vélo-Sport Saint-Affrique	12	\N	0	4
7241	\N	BACCO	Théo	H	Association Sportive Villemur Cyclisme	31	2001	J	NL
7242	\N	AZCON	Roger	H	ASPTT Gaillac Cyclisme	81	\N	0	3
7243	\N	BABEN	François	H	Cercle Athlétique Castelsarrasinois Cyclisme	82	1973	V	4
7244	\N	BANDU	Adrien	H	Cercle Athlétique Castelsarrasinois Cyclisme	82	2004	C	NL
7245	\N	BALTEAU	Jean-François	H	Balma Vélo-Sprint	31	1963	SV	4
7246	\N	BANCON	Thierry	H	Vélo-Club Roquettois Omnisports	31	1960	SV	5
7247	\N	BANQUET	Laurent	H	Association Sportive Muret Cyclisme	31	1972	V	2
7248	\N	BANULS	Hervé	H	Balma Vélo-Sprint	31	1968	SV	5
7249	\N	BARATGIN	Damien	H	Cyclo Fonsorbais	31	1983	S	4
7250	\N	BARATIE	Raymond	H	Team Master Pro 82	82	1943	A	5
7251	\N	BARBAGELATA	Grégory	H	Sorèze Vélo-Club	81	\N	0	4
7252	\N	BARBARESCO	Rémi	H	Vélo Occitan Club	31	1978	V	2
7253	\N	BARBIER	Guillaume	H	Vélo-Club Larra	31	1975	V	NL
7254	\N	BARBIER	Jean-Marie	H	Clarac Comminges Cyclisme	31	1975	V	4
7255	\N	BARBOSA	Cyril	H	Union Sportive Fronton Cyclisme	31	1970	V	5
7256	\N	BARBOSA	Emilie	F	Union Sportive Fronton Cyclisme	31	1997	FE	4
7257	\N	BARCELO	Thierry	H	Vélo-Club CPRS Pins-Justaret/Vilatte	31	1963	SV	3
7258	\N	BARON	Philippe	H	Cyclo Fonsorbais	31	1983	S	4
7259	\N	BARONIA	Lucas	H	Association Cycliste Le Fousseret	31	2002	J	4
7260	\N	BARRERE	Valentin	H	Association Cycliste Le Fousseret	31	\N	0	NL
7261	\N	BARRIE	Hervé	H	Cyclo-Club Castanéen	31	1955	A	5
7262	\N	BARTHE	François	H	Club Olympique Carbonnais Cyclisme	31	1973	V	3
7263	\N	BARTOLI-DAHAN	Maëlle	F	Albi Vélo-Sport	81	\N	0	5
7264	\N	BASCOUL	Pascal	H	ASPTT Gaillac Cyclisme	81	\N	0	4
7265	\N	BATTUT	Jérôme	H	Thales Inter Sports	31	1972	V	4
7266	\N	BAUDEIGNE	Fabien	H	Vélo Occitan Club	31	1976	V	4
7267	\N	BEAUSSAC	Laurent	H	ASPTT Gaillac Cyclisme	81	\N	0	2
7268	\N	BELLANGER	Hugo	H	Tolosa Cycling Team	31	1988	S	3
7269	\N	BELLEC	Irwin	H	Vélo-Club CPRS Pins-Justaret/Vilatte	31	1990	S	3
7270	\N	BENJUMEA	José	H	Club Cycliste Le Boulou	66	1959	A	4
7271	\N	BERGEAUD	Jean	H	Tolosa Cycling Team	31	1994	S	3
7272	\N	BERARD	Eric	H	Balma Vélo-Sprint	31	1966	SV	5
7273	\N	BERGIN	Frédéric	H	Association Sportive des Autobus Toulousains	31	1965	SV	5
7274	\N	BERLAN	Henri	H	Union Sportive Colomiers Cyclisme	31	2000	E	3
7275	\N	BERNAT	Xavier	H	Association Sportive Villemur Cyclisme	31	\N	0	NL
7276	\N	BERNOU	Jean-Claude	H	Cyclo-Club Castanéen	31	1955	A	5
7277	\N	BERNOU	Jérôme	H	Cyclo-Club Castanéen	31	1981	S	3
7281	\N	BETEILLE	Christian	H	Vélo-Club Roquettois Omnisports	31	1954	A	5
7282	\N	BEX	Jacques	H	L'Union Cycliste 31	31	1957	A	5
7288	\N	BIGOT	Floris	H	Association Sportive Muret Cyclisme	31	\N	0	NL
7291	\N	BLADANET	David	H	Team Exper'Cycle	82	\N	0	4
7298	\N	BOEDA	Damien	H	NL	81	\N	0	NL
7301	\N	BONTE	Eric	H	L'Union Cycliste 31	31	1960	SV	5
7308	\N	BOUBEE	Steve	H	Cyclo-Club Castanéen	31	1974	V	3
7311	\N	BOURGADE	Christophe	H	Vélo-Sport Castrais	81	\N	0	4
7318	\N	BOYER	Corentin	H	Vélo-Club Blayais	81	1978	V	4
7321	\N	BREEMEERSCH	Christophe	H	TOAC Cyclisme	31	1976	V	3
7328	\N	BROUSSET	Philippe	H	Association Saint-Nauphary Vélo Sport	82	\N	0	4
7330	\N	BRUNET	Alain	H	Vélo-Club CPRS Pins-Justaret/Vilatte	31	1965	SV	2
7338	\N	CABOT	Guillaume	H	Vélo-Club Roquettois Omnisports	31	1988	S	2
7340	\N	CAGGEGI	Jean-Paul	H	Association Sportive Muret Cyclisme	31	1953	A	NL
7348	\N	CARNEILLE	Pauline	F	Vélo-Sport Castelnaudary	11	\N	0	5
7350	\N	CARRASCO	Guillaume	H	Association Sportive Carcassonne Cyclisme	11	\N	0	2
7358	\N	CASTET	Hugo	H	Club Olympique Carbonnais Cyclisme	31	2005	M	M
7360	\N	CAVAILLE	Florian	H	Vélo-Club Cambonnais	81	\N	0	NL
7368	\N	CENAC	Stéphan	H	Amicale Cycliste Tournefeuille	31	1967	SV	2
7370	\N	CES	Jonathan	H	Association Sportive des Autobus Toulousains	31	1983	S	2
7378	\N	CHAVANT	Alexis	H	Vélo-Sport Castrais	81	1965	SV	2
7381	\N	CHEZEAU	Michel	H	Avenir Cycliste Rabastinois	81	1962	SV	5
7388	\N	CIZOS-DOMEJEAN	Christian	H	Club Olympique Carbonnais Cyclisme	31	1966	SV	4
7390	\N	CLEMENCON	Laurent	H	Clarac Comminges Cyclisme	31	\N	0	NL
7398	\N	COLETTI	Valérien	H	Cyclo-Club Castanéen	31	1947	A	5
7399	\N	COLLIN	Victor	H	JT Cycles Racing	31	1997	E	3
7408	\N	COPPENET	Joffrey	H	Balma Vélo-Sprint	31	1973	V	4
7409	\N	COQUELLE	Thierry	H	Cyclo-Club Castanéen	31	1962	SV	5
7418	\N	COUARRAZE	Stéphane	H	Association Cycliste Le Fousseret	31	1965	SV	5
7419	\N	COUDOURNAC	Pierre	H	Club Olympique Carbonnais Cyclisme	31	1971	V	4
7428	\N	CROUX	Christian	H	Cyclo-Club Castanéen	31	1961	SV	5
7429	\N	CROUZIL	Régis	H	Clarac Comminges Cyclisme	31	1974	V	4
7438	\N	DAMBRON	Thomas	H	Association Sportive Muret Cyclisme	31	2002	J	4
7439	\N	DAMIAN	Gérard	H	NL	83	\N	0	NL
7448	\N	DARDENNE	David	H	Union Sportive Castelsagrat Cyclisme	82	1977	V	3
7449	\N	DARIEL	Florent	H	NL	81	\N	0	NL
7458	\N	DAUZATS	Guillaume	H	L'Union Cycliste 31	31	1991	S	2
7459	\N	DAVAL	Nicolas	H	Empalot Vélo-Club	31	1980	S	4
7468	\N	DECAMPS	Fabien	H	Saint-Gaudens Cyclisme Comminges	31	1976	V	4
7469	\N	DECAMPS	Marc	H	Association Cycliste Le Fousseret	31	1976	V	4
7478	\N	DELDOSSI	Andréa	H	Tolosa Cycling Team	31	1992	S	2
7480	\N	DELFORGE	Franck	H	Vélo Occitan Club	31	1966	SV	4
7488	\N	DENEUVE	Adrien	H	Roue Libre Saman	31	\N	0	NL
7490	\N	DEPLANCQ	Xavier	H	Cyclo-Club Castanéen	31	1981	S	4
7498	\N	DEVILLIERS	Mickaël	H	Club Cycliste Le Boulou	66	\N	0	3
7500	\N	DEVUN	Joachim	H	Vélo Occitan Club	31	1973	V	4
7508	\N	DORME	Yoann	H	Association Sportive et Culturelle Gagnac Cyclisme	31	1992	S	4
7510	\N	DOTTO	Jérémie	H	Gourdan Polignan Comminges Cycliste	31	\N	0	NL
7518	\N	DUCHAYNE	Quentin	H	Association Sportive et Culturelle Gagnac Cyclisme	31	1996	S	2
7520	\N	DUCLOS	Séverine	F	Villeneuve Cycliste	31	1973	FV	5
7528	\N	DUPONT	Léopold	H	Béziers Méditerranée Cyclisme	34	\N	0	5
7530	\N	DURAND	Matthias	H	Vélo-Club CPRS Pins-Justaret/Vilatte	31	1990	S	3
7538	\N	EMERY	Francis	H	Cyclo-Club Castanéen	31	1971	V	4
7540	\N	ESCRIBE	Aurélien	H	Balma Olympique Cyclisme	31	2001	J	4
7548	\N	FAGES	Yannick	H	Saint-Gaudens Cyclisme Comminges	31	1978	V	NL
7550	\N	FALIBOIS	William	H	Roue Libre Saman	31	\N	0	NL
7558	\N	FAVA	Ronan	H	Association Sportive Villemur Cyclisme	31	2006	M	M
7560	\N	FEDOU	Michel	H	Clarac Comminges Cyclisme	31	1948	A	5
7568	\N	FERRIERE	Pierre	H	Balma Vélo-Sprint	31	1976	V	4
7570	\N	FICHOU	Florent	H	Union Sportive Fronton Cyclisme	31	\N	0	NL
7578	\N	FOUASSIER	Frank	H	Association Sportive Muret Cyclisme	31	1972	V	5
7580	\N	FOUCONNIER	Olivier	H	Vélo-Club Roquettois Omnisports	31	1970	V	4
7587	\N	FRECHOU	Antoine	H	Association Cycliste Le Fousseret	31	\N	0	NL
7589	\N	GADENNE	Alain	H	Club Cycliste Le Boulou	66	\N	0	4
7597	\N	GANZA	Ludovic	H	Montauban Cyclisme	82	1979	V	2
7599	\N	GARCIA	Maxime	H	Tolosa Cycling Team	31	1992	S	2
7607	\N	GAYCHET	Robert	H	Camarade Sports & Loisirs	9	\N	0	5
7609	\N	GENESTE	Lucas	H	Association Cycliste Le Fousseret	31	\N	0	NL
7617	\N	GIORGETTI	Sylvain	H	La Roue Carrée Montjovienne (Montjoire)	31	1954	A	5
7619	\N	GIULETTI	Dajana	F	Union Sportive Aviation Latécoère	31	1982	FS	5
7627	\N	GOULARD	Yannis	H	Empalot Vélo-Club	31	1986	S	3
7629	\N	GOUX	Nicolas	H	Béziers Méditerranée Cyclisme	34	\N	0	1
7637	\N	GREEN	Siméon	H	Equipe CMI	82	1979	V	2
7639	\N	GRIL	Michel	H	Cyclo-Club Castanéen	31	1948	A	5
7647	\N	GUEGAN	Jean-Noël	H	Cyclo-Club Bédarieux	34	\N	0	5
7649	\N	GUINARD	Jean-Pascal	H	Saint-Gaudens Cyclisme Comminges	31	1981	S	NL
7657	\N	HAUCHARD	Joël	H	Cyclo-Club Toulouse Lardenne	31	1949	A	5
7659	\N	HEBRARD	Emmanuel	H	Cyclo-Club Castanéen	31	1979	V	4
7667	\N	HUTNIK	Aurélien	H	UV Auch GG	32	1998	E	NL
7669	\N	JACQUES DIT CHERTREAU	Christophe	H	Bruguières Vélo-Club	31	1979	V	2
7677	\N	JOLIBERT	Jean-Jacques	H	Association Sportive Muret Cyclisme	31	1962	SV	NL
7679	\N	JONES	Michael	H	NL	31	\N	0	NL
7279	\N	BERNOU	Serge	H	Cyclo-Club Castanéen	31	1960	SV	5
7290	\N	BITSCH	Julien	H	Cyclo-Club Castanéen	31	1982	S	2
7300	\N	BONNET	Jean-Luc	H	Balma Vélo-Sprint	31	1973	V	2
7310	\N	BOUFFIL	Alain	H	Longages Espoir Cycliste	31	\N	0	NL
7320	\N	BRAS	Jérémy	H	Cyclo-Club des Violettes Castelmauroux	31	1986	S	4
7331	\N	BRUNET	Pierre	H	Balma Olympique Cyclisme	31	1993	S	5
7341	\N	CALAS	Junior	H	Union Sportive Vacquiers	31	\N	0	NL
7351	\N	CARRERAS	Lionel	H	Vélo-Sport Castrais	81	\N	0	4
7361	\N	CAVAILLE	Frédéric	H	Gourdan Polignan Comminges Cycliste	31	\N	0	NL
7371	\N	CHABAUD	Jean-François	H	Union Sportive Fronton Cyclisme	31	1965	SV	2
7380	\N	CHEVALLEREAU	Florian	H	Villeneuve Cycliste	31	\N	0	NL
7389	\N	CLAVIE	Jean-Marc	H	Association Sportive Muret Cyclisme	31	\N	0	NL
7400	\N	COLLODEL	Benjamin	H	Association Sportive Carcassonne Cyclisme	11	\N	0	5
7410	\N	COQUIL	Aurélien	H	Vélo-Club Roquettois Omnisports	31	1991	S	2
7420	\N	COURREGES	Patrick	H	Plaisance du Touch Amicale Cyclisme	31	1969	SV	2
7430	\N	CULLET	Alain	H	Cycling Team Black Devil	31	\N	0	NL
7440	\N	DAMOUR	Jonathan	H	Vélo-Club Roquettois Omnisports	31	1984	S	4
7451	\N	DARY	Matthieu	H	Cyclo-Club Castanéen	31	1987	S	2
7461	\N	DE MARCHI	Victor	H	TOAC Cyclisme	31	1955	A	5
7471	\N	DEGAUQUE	Pascal	H	Cyclo-Club Castanéen	31	1967	SV	4
7482	\N	DELIEGE	William	H	Villeneuve Cycliste	31	1994	S	NL
7492	\N	DESOEUVRE	Arnaud	H	Fonbeauzard Vélo-Club	31	1988	S	4
7502	\N	DIRAT	Clément	H	Empalot Vélo-Club	31	1973	V	3
7512	\N	DOUSSIN	Valentin	H	Association Cycliste Le Fousseret	31	\N	0	NL
7522	\N	DUFAU	Alain	H	L'Union Cycliste 31	31	1958	A	5
7532	\N	DURTAUT	Julien	H	NL	32	\N	0	NL
7542	\N	ESPINOUX	Antoine	H	TUC Triathlon	31	1995	S	NL
7552	\N	FAURE	René	H	Cyclo-Club Castanéen	31	1952	A	5
7562	\N	FERAUD	Jérôme	H	Vélo Occitan Club	31	1983	S	3
7572	\N	FIGUIGUI	Frédéric	H	NL	81	\N	0	NL
7582	\N	FOUQUET	Dominique	H	Vélo-Club Roquettois Omnisports	31	1963	SV	4
7592	\N	GALBUSERA	Guy	H	Lavaur Vélo-Club	81	\N	0	5
7602	\N	GARIN	Pierrick	H	NL	82	1978	V	NL
7612	\N	GERMANIER	Gérard	H	NL	31	\N	0	NL
7622	\N	GONCALVES	Cédric	H	Union Vélocipédique Mazamétaine	81	1984	S	NL
7632	\N	GRAS	Jean-Philippe	H	Comité FSGT 81	81	1976	V	4
7640	\N	GROS	Didier	H	Association Sportive et Culturelle Gagnac Cyclisme	31	1972	V	4
7651	\N	GUIRAUD	Alain	H	Avenir Cycliste Auterivain	31	1953	A	5
7661	\N	HEMART	Guillaume	H	Association Sportive Muret Cyclisme	31	\N	0	NL
7671	\N	JALADEAU	Artus	H	Association Sportive Carcassonne Cyclisme	11	\N	0	3
7681	\N	JONIN	Florian	H	Sorèze Vélo-Club	81	2001	J	4
7691	\N	KORAL	Pascal	H	Etoile Sportive Gimont Cyclo	32	1964	SV	5
7701	\N	LACROIX	Baptiste	H	Roue Libre Saman	31	1974	V	NL
7711	\N	LAGRANGE	Roméo	H	Guidon Sportif Coursan/Narbonne	11	\N	0	3
7722	\N	LAPUYADE	Isis	F	Balma Vélo-Sprint	31	1989	FS	5
7732	\N	LATHELIZE	Hélène	H	Clarac Comminges Cyclisme	31	\N	0	NL
7742	\N	LE CALVEZ	Eric	H	L'Union Cycliste 31	31	1970	V	4
7752	\N	LEGUEVAQUE	Régis	H	Union Sportive Colomiers Cyclisme	31	1991	S	2
7762	\N	LHUILIER	Jeanne	H	NL	9	\N	0	NL
7772	\N	LOPEZ	Antoine	H	Centre Sportif Omnisports Ariègeois 09	9	1972	V	2
7782	\N	LOUNNAS	Maxime	H	Association Sportive Muret Cyclisme	31	1986	S	3
7792	\N	MALLET	Olivier	H	Saint-Gaudens Cyclisme Comminges	31	1966	SV	NL
7800	\N	MARCHAND	Franck	H	Revel Sprinter-Club	31	1985	S	3
7810	\N	MARTIN	Gérard	H	Association Guidon Verdunois	31	1950	A	NL
7821	\N	MARTY	Gaël	H	Béziers Méditerranée Cyclisme	34	\N	0	2
7831	\N	MATHIEUX	Patrice	H	Club Olympique Carbonnais Cyclisme	31	1959	A	5
7841	\N	MENDONCA	Sébastien	H	Espagne	\N	\N	0	NL
7851	\N	MICAS	Matthias	H	Saint-Gaudens Cyclisme Comminges	31	1999	E	NL
7861	\N	MIQUEL	Mathieu	H	Cyclo-Club Léguevin	31	1979	V	4
7871	\N	MONTAUBAN	Christophe	H	Saint-Gaudens Cyclisme Comminges	31	1953	A	5
7881	\N	MOURET	Guilhem	H	Vélo-Club Roquettois Omnisports	31	1981	S	5
7891	\N	NEGRE	Jean-Pierre	H	L'Union Cycliste 31	31	1973	V	5
7901	\N	OUSTRIC	Joël	H	TOAC Cyclisme	31	1973	V	4
7911	\N	PALMADE	Arthur	H	Cyclo-Club Castanéen	31	1992	S	3
7921	\N	PASTRE	Rodolphe	H	NL	81	\N	0	NL
7931	\N	PENDERY	Andrew	H	Association Sportive Carcassonne Cyclisme	11	1962	SV	2
7941	\N	PERUSIN	Benjamin	H	Vélo-Club Mauvezinois	32	1986	S	2
7951	\N	PEYTAVI	Tristan	H	Club Olympique Carbonnais Cyclisme	31	1996	S	2
7961	\N	PIQUEMAL	Pierre	H	Vélo-Club Larra	31	1966	SV	5
7971	\N	POWELL	John	H	NL	82	\N	0	NL
7981	\N	QUESNEL	Christian	H	Vélo-Club Roquettois Omnisports	31	1956	A	5
7991	\N	RAPAUD	Mikaël	H	Association Cycliste Le Fousseret	31	\N	0	M
8001	\N	RELLIER	Pierre	H	Vertical Bike Muret	31	1980	S	2
8011	\N	RIBAS	Clément	H	Canohes Avenir Cyclisme	66	1998	E	2
8020	\N	RIVES	Jean-Marc	H	Cyclo-Club Castanéen	31	1972	V	4
8030	\N	RODRIGUEZ	Sylvain	H	ASPTT Gaillac Cyclisme	81	\N	0	NL
8040	\N	ROUALDES	Philippe	H	Vélo-Club Roquettois Omnisports	31	1967	SV	4
8050	\N	ROUX	Benjamin	H	Union Sportive Vacquiers	31	\N	0	NL
8060	\N	SACHOT	Nicolas	H	Vélo-Club Roquettois Omnisports	31	1987	S	3
8070	\N	SALLES	Eric	H	Vélo Occitan Club	31	1972	V	4
8080	\N	SAUTEREAU	Benoit	H	Balma Vélo-Sprint	31	1974	V	4
8090	\N	SCORCIONE	Philippe	H	Cyclo-Club Castanéen	31	1967	SV	4
8100	\N	SIERRA	Aurélien	H	Clarac Comminges Cyclisme	31	\N	0	NL
8110	\N	SOLIVA	Joan	H	Béziers Méditerranée Cyclisme	34	\N	0	1
7280	\N	BERRUEZO	Pierre	H	ASPTT Gaillac Cyclisme	81	\N	0	2
7292	\N	BLANDINIERS	Benoit	H	Vélo-Sport Castelnaudary	11	\N	0	4
7303	\N	BONTEMPS	Julien	H	Clarac Comminges Cyclisme	31	\N	0	NL
7313	\N	BOUTES	Corinne	F	Vélo-Sport Castrais	81	\N	0	5
7324	\N	BRIANTI	Yann	H	Vélo-Sport Castrais	81	\N	0	4
7334	\N	BUSSON	David	H	Club Cycliste Le Boulou	66	\N	0	3
7345	\N	CANTORO	Clément	H	Cyclo-Club Castanéen	31	1989	S	3
7356	\N	CASSARO	Corentin	H	Sorèze Vélo-Club	81	1995	S	3
7366	\N	CAZABAN	Julien	H	Vélo Sprint Narbonnais	11	\N	0	NL
7376	\N	CHAUBARD	Christophe	H	Clarac Comminges Cyclisme	31	1957	A	5
7386	\N	CIEUTAT	Alain	H	Vélo-Club Roquettois Omnisports	31	1966	SV	4
7396	\N	COCHEZ	Marcel	H	Empalot Vélo-Club	31	1949	A	NL
7406	\N	CONDOURET	Laetitia	F	Sorèze Vélo-Club	81	\N	0	5
7416	\N	COSTE	Sébastien	H	Association Sportive Muret Cyclisme	31	1986	S	NL
7426	\N	COUTINHO	Auguste	H	Saint-Gaudens Cyclisme Comminges	31	1963	SV	NL
7436	\N	DAHAN	Joseph	H	Albi Vélo-Sport	81	1977	V	4
7446	\N	DAPY	Marc	H	Montauban Cyclisme	82	\N	0	5
7456	\N	DAURIAC	Alain	H	Vélo-Club Roquettois Omnisports	31	1952	A	5
7466	\N	DEBEZY	Louis	H	Cyclo-Club Castanéen	31	1952	A	5
7476	\N	DELANNOY	Virgil	H	Empalot Vélo-Club	31	2002	J	4
7486	\N	DEMEURE	Marc-Olivier	H	Equipe CMI	82	\N	0	3
7496	\N	DEVEYT	Guillaume	H	Association Sportive Villemur Cyclisme	31	\N	0	NL
7506	\N	DONZELLI	Jean-Claude	H	Union Sportive Castelsagrat Cyclisme	82	1949	A	5
7516	\N	DUBROCA	Laurent	H	L'Union Cycliste 31	31	1972	V	5
7525	\N	DUPHIL	Christophe	H	L'Union Cycliste 31	31	1972	V	4
7536	\N	ECHE	Sébastien	H	TOAC Cyclisme	31	1978	V	4
7546	\N	ESTOUP	Thomas	H	Cyclo-Club Castanéen	31	1983	S	3
7556	\N	FAVA	Franc	H	Association Sportive Villemur Cyclisme	31	1969	SV	2
7566	\N	FERRE	Nicolas	H	Association Bicyclettes 09	9	1986	S	NL
7576	\N	FONTAINE	Patrick	H	Camarade Sports & Loisirs	9	1954	A	5
7586	\N	FRANCOIS	Jean	H	Association Sportive et Culturelle Gagnac Cyclisme	31	\N	0	NL
7596	\N	GAMBERO	Henri	H	L'Union Cycliste 31	31	1951	A	5
7606	\N	GAY	Robert	H	L'Union Cycliste 31	31	1950	A	5
7616	\N	GILLIS	Guillaume	H	Vélo-Club Roquettois Omnisports	31	1983	S	4
7626	\N	GONZALVEZ	Laurent	H	Club Cycliste Le Boulou	66	1976	V	4
7636	\N	GRAU	Angel	H	Thales Inter Sports	31	1963	SV	5
7646	\N	GUEFFIER	Claude	H	Empalot Vélo-Club	31	1950	A	5
7656	\N	HANNON	Gilles	H	L'Union Cycliste 31	31	1972	V	4
7666	\N	HUBSCHWERLIN	Philippe	H	Revel Sprinter-Club	31	1961	SV	5
7676	\N	JEREMIE	Alex	H	Tolosa Cycling Team	31	1979	V	4
7686	\N	JULIA	Bruno	H	Cyclo-Club Castanéen	31	1964	SV	5
7696	\N	LACAZA	Gabriel	H	Saint-Gaudens Cyclisme Comminges	31	2003	C	NL
7706	\N	LAFONT	Christian	H	Clarac Comminges Cyclisme	31	1957	A	5
7716	\N	LANNE-PETIT	Francis	H	L'Union Cycliste 31	31	1961	SV	5
7726	\N	LARUE	Jordan	H	Béziers Méditerranée Cyclisme	34	\N	0	3
7736	\N	LAURENT	Sébastien	H	Cyclo Fonsorbais	31	1983	S	5
7746	\N	LE TOLLEC	Stéphane	H	Balma Vélo-Sprint	31	1961	SV	4
7756	\N	LESCURE	Frédéric	H	Vélo-Club Roquettois Omnisports	31	1975	V	2
7766	\N	LITCMAN	Nicolas	H	Cyclo-Club Castanéen	31	1987	S	3
7776	\N	LORMIER	Lilian	H	Saint-Gaudens Cyclisme Comminges	31	2005	M	NL
7786	\N	MAGONTHIER	Aurélien	H	L'Union Cycliste 31	31	1998	E	2
7796	\N	MANENQ	Maxime	H	Vélo Occitan Club	31	2011	N/A	M
7806	\N	MARSEILLAC	Sébastien	H	Balma Olympique Cyclisme	31	1981	S	4
7816	\N	MARTINEZ	Emmanuel	H	Association Sportive Carcassonne Cyclisme	11	1973	V	4
7826	\N	MASSAT	Jean-Michel	H	Cyclo-Club Castanéen	31	1961	SV	4
7836	\N	MAZURE	Romain	H	Comité FSGT 31	31	1987	S	3
7846	\N	MERLE	Mathieu	H	Amicale Cycliste Tournefeuille	31	1986	S	4
7856	\N	MIGOT	Corinne	F	Vélo-Club CPRS Pins-Justaret/Vilatte	31	1973	FV	5
7866	\N	MOLINIER	Eric	H	ASPTT Gaillac Cyclisme	81	\N	0	3
7876	\N	MONTMASSON	Lionel	H	Balma Vélo-Sprint	31	1971	V	3
7886	\N	NADAUD	Dominique	H	L'Union Cycliste 31	31	1949	A	5
7896	\N	NOWAK	Ugo	H	Montauban Cyclisme	82	2004	C	NL
7906	\N	PAGES	Cédric	H	Saint-Juéry Olympique Cyclisme	81	\N	0	3
7916	\N	PAOLETTI	Lionel	H	Union Sportive Castelsagrat Cyclisme	82	\N	0	3
7926	\N	PAYRAULT	Gervais	H	Cyclo-Club Castanéen	31	1962	SV	5
7936	\N	PEREZ	Mathieu	H	Cyclo-Club Mazérien	9	\N	0	3
7946	\N	PETROLINI	Martine	F	Gourdan Polignan Comminges Cycliste	31	\N	0	NL
7956	\N	PICCIN	Aymeric	H	Balma Olympique Cyclisme	31	1990	S	3
7966	\N	POCQ	David	H	L'Union Cycliste 31	31	1972	V	3
7976	\N	PUERTA	Angel	H	Vélo-Sport Castrais	81	\N	0	4
7986	\N	RABBE	Joris	H	ASPTT Gaillac Cyclisme	81	\N	0	2
7996	\N	RAYNAUD	Nicolas	H	Cyclo-Club Mazérien	9	\N	0	3
8006	\N	RENAUD	Mikaël	H	Association Sportive et Culturelle Gagnac Cyclisme	31	1979	V	4
8016	\N	RICHARD	Laure	F	Balma Vélo-Sprint	31	1969	FSV	5
8026	\N	ROBINET	Jean-Jacques	H	Amicale Cycliste Tournefeuille	31	1963	SV	5
8036	\N	RONSIN HARDY	Gwenaël	H	Equipe CMI	82	\N	0	3
8046	\N	ROUSSELOT	Simon	H	Union Sportive Colomiers Cyclisme	31	2001	J	4
8056	\N	RULLAC	Fabien	H	Canohes Avenir Cyclisme	66	\N	0	4
8066	\N	SAJAS	Patrick	H	Saint-Gaudens Cyclisme Comminges	31	1965	SV	4
8076	\N	SARNIGUET	Frédéric	H	Camarade Sports & Loisirs	9	1970	V	2
8086	\N	SCHRUOFFENEGER	Christophe	H	Association Sportive Muret Cyclisme	31	\N	0	NL
8096	\N	SERVANT	Emmanuel	H	Balma Vélo-Sprint	31	1973	V	4
8106	\N	SLAGMULDER	Joffrey	H	Sorèze Vélo-Club	81	1989	S	2
7283	\N	BETEILLE	Lucie	F	L'Union Cycliste 31	31	1985	FS	5
7293	\N	BLANQUIER	Dorian	H	Saint-Gaudens Cyclisme Comminges	31	1981	S	3
7302	\N	BONTEMPS	Francis	H	Association Guidon Verdunois	31	1967	SV	NL
7312	\N	BOUSQUET	Francis	H	Saint-Juéry Olympique Cyclisme	81	\N	0	5
7322	\N	BREITEL	Didier	H	Sorèze Vélo-Club	81	\N	0	5
7332	\N	BRUNO	Robin	H	La Pancarte	81	1991	S	2
7343	\N	CAMILLO	Angel	H	Association Cycliste Le Fousseret	31	\N	0	NL
7353	\N	CARTAL	Richard	H	Team ATC Donzère	26	\N	0	3
7363	\N	CAVAILLEZ	Vincent	H	Cyclo-Club Castanéen	31	1982	S	3
7373	\N	CHAIX	Charlène	F	Union Sportive Castelsagrat Cyclisme	82	1988	FS	5
7383	\N	CHOTEAU	Fabien	H	Guidon Verdunois	82	1969	SV	NL
7394	\N	CLOT	Estéban	H	Cercle Athlétique Castelsarrasinois Cyclisme	82	\N	0	2
7405	\N	COMPSTOM	David	H	NL	31	\N	0	NL
7415	\N	COSTADOAT	Dominique	H	L'Union Cycliste 31	31	1960	SV	5
7425	\N	COUTELLE	Stéphane	H	Tolosa Cycling Team	31	1992	S	4
7435	\N	DAFFOS	Olivier	H	Vélo-Club CPRS Pins-Justaret/Vilatte	31	1980	S	3
7445	\N	DANIS	Fabien	H	Saint-Gaudens Cyclisme Comminges	31	1991	S	2
7455	\N	DAUNES	Jean-Guy	H	Montréjeau Cyclo-Club	31	\N	0	NL
7465	\N	DEBESNE	Bernard	H	Cyclo-Club Castanéen	31	1947	A	5
7475	\N	DELANNOY	Michel	H	Empalot Vélo-Club	31	1967	SV	4
7484	\N	DELRIEU	Franck	H	Association Sportive Villemur Cyclisme	31	1973	V	2
7494	\N	DESRIAC	Thomas	H	Vélo-Club Roquettois Omnisports	31	1988	S	3
7504	\N	DOLCIN-TILLANT	Dominique	H	Union Sportive Madinina Gwada	81	\N	0	4
7513	\N	DOYEN	Cyrille	H	Balma Olympique Cyclisme	31	1975	V	3
7523	\N	DUHAR	Pascal	H	Balma Vélo-Sprint	31	1952	A	5
7533	\N	DURVELLE	Laurent	H	Camarade Sports & Loisirs	9	1971	V	3
7543	\N	ESPOUY	Gilles	H	Gourdan Polignan Comminges Cycliste	31	\N	0	NL
7553	\N	FAURESSE	Clément	H	TOAC Cyclisme	31	2006	M	M
7563	\N	FERNANDES	Paulin	H	Villeneuve Cycliste	31	2001	J	NL
7573	\N	FISSE	Michel	H	Thales Inter Sports	31	1961	SV	5
7583	\N	FOURNES	David	H	Cyclo-Club Castanéen	31	1977	V	3
7593	\N	GALLO	Philippe	H	Association Bicyclettes 09	9	\N	0	NL
7603	\N	GASC	Jérôme	H	NL	81	\N	0	NL
7613	\N	GHELARDINI	Serge	H	Association Cycliste Le Fousseret	31	\N	0	NL
7623	\N	GONNARD	Thierry	H	L'Union Cycliste 31	31	1968	SV	4
7633	\N	GRAS	Jérémy	H	Clarac Comminges Cyclisme	31	\N	0	NL
7643	\N	GROSJEAN	Jacques	H	Fonbeauzard Vélo-Club	31	1962	SV	4
7653	\N	GUYON	Franck	H	Vélo-Club Roquettois Omnisports	31	1994	S	3
7663	\N	HERVAS	Lucas	H	Gourdan Polignan Comminges Cycliste	31	\N	0	NL
7673	\N	JAULIN	Vincent	H	NL	16	\N	0	NL
7683	\N	JOUAN	Sévérine	F	Association Espoir Cyclo Ognes	2	1992	FS	NL
7694	\N	LABOUYRIE	Jean-Marc	H	Amicale Cyclo Escalquens	31	1962	SV	5
7704	\N	LAFFONT	Johann	H	Vélo-Club Roquettois Omnisports	31	1979	V	2
7714	\N	LAMOTTE	Pascal	H	Union Sportive Castelsagrat Cyclisme	82	\N	0	5
7724	\N	LARROQUE	Fabien	H	Etoile Sportive Gimont Cyclo	32	1987	S	4
7734	\N	LAURENT	Eric	H	Empalot Vélo-Club	31	1960	SV	2
7743	\N	LE CALVEZ	Tanguy	H	L'Union Cycliste 31	31	1998	E	3
7753	\N	LEMAIRE	Nicolas	H	Balma Olympique Cyclisme	31	1989	S	2
7764	\N	LHUILLIER	Baptiste	H	Cyclo Salvetain (La Salvetat Saint Gilles)	31	1982	S	4
7773	\N	LOPEZ	Benjamin	H	Béziers Méditerranée Cyclisme	34	\N	0	2
7783	\N	LUCENA	Romain	H	Revel Sprinter-Club	31	1990	S	3
7793	\N	MALON	Frédéric	H	Cyclo Fonsorbais	31	1989	S	3
7803	\N	MARQUET	Nathaël	H	Union Sportive Colomiers Cyclisme	31	1985	S	2
7813	\N	MARTIN	Thomas	H	JT Cycles Racing	31	1996	S	2
7823	\N	MASCARAS	Etan	H	Cercle Athlétique Castelsarrasinois Cyclisme	82	2006	M	NL
7833	\N	MAUPILER	Mathieu	H	Tolosa Cycling Team	31	1987	S	2
7843	\N	MENEGHETTI	Rodolfo	H	Guidon Sportif Coursan/Narbonne	11	\N	0	3
7853	\N	MICHE	Olivier	H	Bruguières Vélo-Club	31	1982	S	3
7863	\N	MIRAL	Gilbert	H	La Roue Carrée Montjovienne (Montjoire)	31	1956	A	5
7874	\N	MONTFORT	Stéphane	H	Sorèze Vélo-Club	81	\N	0	4
7884	\N	MURO	Gilles	H	Vélo Occitan Club	31	1970	V	4
7894	\N	NOGUERA	Michel	H	Cyclo Fonsorbais	31	1966	SV	5
7904	\N	PADIE	Jonathan	H	Sorèze Vélo-Club	81	\N	0	4
7914	\N	PAMPIRI	Pascal	H	Amicale Cycliste Tournefeuille	31	1963	SV	4
7924	\N	PAVY	Marc	H	Balma Vélo-Sprint	31	1961	SV	5
7934	\N	PENSERENI	Fabien	H	Romilly Sports 10	10	1960	SV	4
7944	\N	PETITE	Marc	H	Montréjeau Cyclo-Club	31	\N	0	NL
7954	\N	PHILIPPON	Michel	H	Team Exper'Cycle	82	1953	A	5
7964	\N	PLAZA	Christophe	H	Tolosa Cycling Team	31	1982	S	4
7974	\N	PRIOTO	Antoine	H	Clarac Comminges Cyclisme	31	\N	0	NL
7984	\N	RABANI	Jean-Claude	H	Team Master Pro 82	82	1941	A	5
7994	\N	RAYNAL	Philippe	H	JT Cycles Racing	31	1972	V	4
8004	\N	REMY	Laurent	H	Empalot Vélo-Club	31	1972	V	2
8014	\N	RIBEROT	David	H	Bruguières Vélo-Club	31	1975	V	4
8024	\N	ROBIDOU	Yannick	H	Sorèze Vélo-Club	81	\N	0	4
8034	\N	ROMANIN	Jean-Pierre	H	Cyclo-Club Mazérien	9	\N	0	5
8044	\N	ROUGIER	Hugo	H	NL	31	\N	0	NL
8054	\N	RUFFIE	Guillaume	H	Vélo-Club CPRS Pins-Justaret/Vilatte	31	1990	S	3
8064	\N	SAINT-MACARY	Stéphane	H	Cyclo-Club Castanéen	31	1970	V	2
8074	\N	SANNINO	Léa	F	Tolosa Cycling Team	31	1995	FS	5
8084	\N	SCARANTO	Antoine	H	Roue Libre Saman	31	\N	0	NL
8094	\N	SERRA	Sébastien	H	Vélo-Club Roquettois Omnisports	31	1981	S	2
8104	\N	SIRAC	Denis	H	Balma Vélo-Sprint	31	1961	SV	5
8114	\N	SOULA	Eric	H	Vélo Occitan Club	31	1969	SV	4
8124	\N	SURIER	Sébastien	H	Cyclo-Club Castanéen	31	1994	S	3
7284	\N	BETTIN	Lionel	H	Cyclo-Club Castanéen	31	1971	V	4
7294	\N	BLATTES	Virgile	H	Plaisance du Touch Amicale Cyclisme	31	1983	S	3
7304	\N	BONZOM	Thomas	H	Association L'Alternative VTT	9	\N	0	NL
7314	\N	BOUYSSOU	Christophe	H	NL	82	1978	V	NL
7323	\N	BRIAN	Raphael	H	NL	81	\N	0	NL
7333	\N	BURLOT	Stephane	H	Canohes Avenir Cyclisme	66	1972	V	4
7344	\N	CAMPOUSSI	Laurent	H	Vertical Bike Muret	31	1985	S	3
7354	\N	CASSAGNEAU	Jérôme	H	Association Saint-Nauphary Vélo Sport	82	1974	V	3
7364	\N	CAYLA	Paul	H	Balma Vélo-Sprint	31	1987	S	4
7374	\N	CHAPELET	Sébastien	H	Couserans Cycliste	31	\N	0	NL
7384	\N	CHOURRE	David	H	Association Sportive des Autobus Toulousains	31	1975	V	4
7393	\N	CLEMENTE	Kevin	H	Association Cycliste Le Fousseret	31	\N	0	NL
7403	\N	COMBES	Maxence	H	Cyclo-Club Castanéen	31	1992	S	3
7413	\N	CORNET	Olivier	H	Vélo Occitan Club	31	1970	V	4
7423	\N	COUSINIE	Vincent	H	Lavaur Vélo-Club	81	1998	E	3
7433	\N	DA PIEDADE JORGE	Tiago	H	Cyclo-Club Castanéen	31	1981	S	3
7443	\N	DANIEAU	Stéphane	H	NL	81	1971	V	4
7453	\N	DAUMOND	Cyril	H	Vélo-Sport Castrais	81	\N	0	4
7463	\N	DE SAUNAC	Guilhem	H	Balma Vélo-Sprint	31	1965	SV	5
7473	\N	DELAHAYE	Fabrice	H	Vélo-Club Roquettois Omnisports	31	1975	V	4
7483	\N	DELMAS	Olivier	H	Cercle Athlétique Castelsarrasinois Cyclisme	82	\N	0	2
7493	\N	DESPEYROUX	Florent	H	Association Union Cyclo-Capdenac	12	\N	0	NL
7503	\N	DOCONTO	Patrick	H	Cyclo-Club Castanéen	31	1956	A	5
7514	\N	DRUSIAN	Ludovic	H	Sorèze Vélo-Club	81	\N	0	2
7524	\N	DUMONT	Damien	H	Vélo-Club Roquettois Omnisports	31	1988	S	5
7534	\N	DUTOUR	Bernard	H	Union Sportive Castelsagrat Cyclisme	82	\N	0	5
7545	\N	ESTEVE	Laurent	H	Club Cycliste Le Boulou	66	1976	V	4
7555	\N	FAURESSE	Jérôme	H	TOAC Cyclisme	31	1974	V	4
7565	\N	FERRASSE	Damien	H	Association Couserans Cycliste	31	\N	0	NL
7575	\N	FONQUERNE	Cédric	H	Villeneuve Cycliste	31	1999	E	NL
7585	\N	FOURREAUX	Eric	H	Vélo-Club CPRS Pins-Justaret/Vilatte	31	1968	SV	4
7595	\N	GALZAGORI	Julien	H	Saint-Gaudens Cyclisme Comminges	31	1979	V	NL
7605	\N	GAVALDA	Eric	H	Vélo-Sport Castrais	81	\N	0	4
7615	\N	GIGOUT	Jean-Claude	H	Cyclo-Club Toulouse Lardenne	31	1945	A	5
7625	\N	GONZALEZ	Philippe	H	Association Cycliste Le Fousseret	31	1965	SV	5
7635	\N	GRASSI	Aurélien	H	Association Sportive Muret Cyclisme	31	\N	0	NL
7645	\N	GROSLIER	Pascal	H	Vélo-Club Mauvezinois	32	1965	SV	5
7655	\N	HABOUZIT	Michel	H	Vélo-Club Saint-Cyprien	47	\N	0	4
7665	\N	HUBERT	Xavier	H	NL	82	\N	0	NL
7675	\N	JEGOU	Frédéric	H	Etoile Sportive Gimont Cyclo	32	1990	S	4
7685	\N	JOURDAN	Thomas	H	Vélo-Club Roquettois Omnisports	31	2001	J	4
7695	\N	LABOUYSSE	Florian	H	Balma Olympique Cyclisme	31	1991	S	3
7705	\N	LAFITE	Marc	H	TOAC Cyclisme	31	1952	A	5
7715	\N	LANET	Rémi	H	TOAC Cyclisme	31	1977	V	2
7725	\N	LARROUDE	David	H	Club Olympique Carbonnais Cyclisme	31	1968	SV	5
7735	\N	LAURENT	Gabriel	H	Vélo-Club CPRS Pins-Justaret/Vilatte	31	1962	SV	4
7745	\N	LE POETVIN	Cyrille	H	Union Sportive Colomiers Cyclisme	31	1973	V	3
7755	\N	LEROUX	Arnaud	H	Amicale Cyclo Escalquens	81	\N	0	NL
7765	\N	LIENARD	Dimitri	H	NL	81	\N	0	NL
7775	\N	LORMANT	Patrick	H	Saint-Gaudens Cyclisme Comminges	31	1969	SV	NL
7785	\N	MAGNOAC	Jean-Jacques	H	Saint-Gaudens Cyclisme Comminges	31	1956	A	4
7795	\N	MANDON	Julien	H	Balma Vélo-Sprint	31	1985	S	3
7805	\N	MARQUIS	Alexandre	H	Cyclo-Club des Violettes Castelmauroux	31	1973	V	3
7815	\N	MARTINEZ	Didier	H	Guidon Sportif Coursan/Narbonne	11	1973	V	4
7825	\N	MASOT	Henri	H	Empalot Vélo-Club	31	1962	SV	4
7835	\N	MAURY	Alain	H	L'Union Cycliste 31	31	1960	SV	5
7845	\N	MERCADIER	Dorian	H	Association Sportive Muret Cyclisme	31	2001	J	4
7855	\N	MIEYAN	Franck	H	Gourdan Polignan Comminges Cycliste	31	\N	0	NL
7865	\N	MOLENE	Sébastien	H	Vélo-Club CPRS Pins-Justaret/Vilatte	31	1977	V	2
7875	\N	MONTI	Walter	H	Association Cyclisme Clapiers	34	\N	0	4
7885	\N	MUSELET	Thierry	H	Amicale Cycliste Tournefeuille	31	1961	SV	5
7895	\N	NOUGAYREDE	Christian	H	Union Sportive Castelsagrat Cyclisme	82	1944	A	5
7905	\N	PAGANI	Michel	H	Cyclo-Club Toulouse Lardenne	31	1945	A	5
7915	\N	PANISSARD	Nicolas	H	Montauban Cyclisme	82	1981	S	3
7925	\N	PAYRASTRE	Michel	H	Vélo-Club Roquettois Omnisports	31	1951	A	5
7935	\N	PEREIRA	Antoine	H	Montréjeau Cyclo-Club	31	\N	0	NL
7945	\N	PETITFRERE	Lucien	H	Cyclo-Club Toulouse Lardenne	31	1956	A	5
7955	\N	PIBAROT	Didier	H	Vélo-Club CPRS Pins-Justaret/Vilatte	31	1968	SV	4
7965	\N	POCQ	Alain	H	L'Union Cycliste 31	31	1948	A	5
7975	\N	PRISSE	Thierry	H	Cyclo Fonsorbais	31	1964	SV	4
7985	\N	RABANI	Olivier	H	Team Master Pro 82	82	1974	V	4
7995	\N	RAYNAUD	Emmanuel	H	Cyclo-Club Mazérien	9	1982	S	4
8005	\N	REMY	Stéphane	H	Clarac Comminges Cyclisme	31	\N	0	NL
8015	\N	RICHARD	Guillaume	H	Sorèze Vélo-Club	81	1969	SV	2
8025	\N	ROBIN	Xavier	H	Vélo-Club Roquettois Omnisports	31	1978	V	4
8035	\N	ROMANO	Christophe	H	Balma Vélo-Sprint	31	1963	SV	5
8045	\N	ROUSSEAU	Frédéric	H	Cyclo-Club Castanéen	31	1975	V	3
8055	\N	RUIZ	Gauthier	H	Vélo-Sport Castelnaudary	11	\N	0	3
8065	\N	SAINT-MARTIN	Franck	H	Vélo Occitan Club	31	1979	V	3
8075	\N	SANSEGOLO	Tristan	H	Cercle Athlétique Castelsarrasinois Cyclisme	82	2002	J	2
8085	\N	SCHAEFFER	Pascal	H	Balma Vélo-Sprint	31	1972	V	4
8095	\N	SERRADEIL	Pierre-Yves	H	Cyclo-Club Castanéen	31	1965	SV	5
8105	\N	SISTENICH	Didier	H	L'Union Cycliste 31	31	1965	SV	4
7285	\N	BEZE	Ludovic	H	Roue Libre Saman	31	\N	0	NL
7295	\N	BOAROLO	Joseph	H	Association Sportive des Autobus Toulousains	31	1961	SV	5
7305	\N	BONZON	Yann	H	Saint-Gaudens Cyclisme Comminges	31	2005	M	M
7315	\N	BOYE	Christian	H	Amicale Cycliste Tournefeuille	31	1958	A	5
7325	\N	BRINGER	Jean-Louis	H	Association Saint-Nauphary Vélo Sport	82	\N	0	5
7335	\N	BYERS	Kévin	H	Camarade Sports & Loisirs	9	1964	SV	3
7342	\N	CALASTRENC	Antoine	H	Tolosa Cycling Team	31	1989	S	3
7352	\N	CARRIERE	Romain	H	Vélo-Club Roquettois Omnisports	31	1981	S	2
7362	\N	CAVAILLE	Sophie	F	Gourdan Polignan Comminges Cycliste	31	\N	0	NL
7372	\N	CHADELLE	Patrick	H	Vélo-Club Roquettois Omnisports	31	1963	SV	5
7382	\N	CHEZZI	Arnaud	H	Vélo-Club Roquettois Omnisports	31	1978	V	4
7392	\N	CLEMENTE	Gines	H	Association Cycliste Le Fousseret	31	\N	0	NL
7402	\N	COMBES	Alexandre	H	Vélo D'Alcas	12	1992	S	3
7412	\N	CORDON	Christophe	H	L'Union Cycliste 31	31	1984	S	4
7422	\N	COUSINIE	Alexis	H	Vélo-Sport Léo Lagrange Castres	81	2002	J	NL
7432	\N	DA COSTA	Joseph	H	Cyclo Salvetain (La Salvetat Saint Gilles)	31	1972	V	4
7441	\N	DANDINE	Jérôme	H	Camarade Sports & Loisirs	9	1976	V	3
7450	\N	DARNIS	Florent	H	La Roue Carrée Montjovienne (Montjoire)	31	1995	S	3
7460	\N	DE ALMEIDA	Stéphane	H	Sorèze Vélo-Club	81	\N	0	3
7470	\N	DEDIEU	Franck	H	L'Union Cycliste 31	31	1961	SV	4
7479	\N	DELEMAILLY	Eric	H	Association Sportive et Culturelle Gagnac Cyclisme	31	1967	SV	5
7489	\N	DENYS	Jean-François	H	Association Sportive et Culturelle Gagnac Cyclisme	31	1972	V	4
7499	\N	DEVOUGE	Maxime	H	Balma Vélo-Sprint	31	1989	S	3
7509	\N	DOSSAT	Michel	H	Avenir Cycliste Auterivain	31	1953	A	5
7519	\N	DUCLOS	Ludovic	H	ASPTT Gaillac Cyclisme	81	1987	S	2
7529	\N	DUPRAT	Jean-Marc	H	Clarac Comminges Cyclisme	31	1957	A	5
7539	\N	EPPINGER	Christophe	H	Association Sportive Muret Cyclisme	31	1960	SV	5
7549	\N	FALANDRY	Léo	H	Association Sportive Carcassonne Cyclisme	11	\N	0	3
7559	\N	FAVAREL	Julien	H	Clarac Comminges Cyclisme	31	\N	0	NL
7569	\N	FEUTRIER	Francis	H	Union Sportive Castelsagrat Cyclisme	82	1968	SV	4
7579	\N	FOUCHOU-LAPEYRADE	Christophe	H	Team Sud Vélo Montpellier	34	\N	0	5
7590	\N	GABY	Jérôme	H	Bruguières Vélo-Club	31	1978	V	2
7600	\N	GARCIA	Patrick	H	Association Saint-Nauphary Vélo Sport	82	1992	S	5
7610	\N	GENESTE	Stéphane	H	Couserans Cycliste	31	\N	0	NL
7620	\N	GLOUX	Eddy	H	Union Sportive Castelsagrat Cyclisme	82	\N	0	2
7630	\N	GOUZE	Xavier	H	Association Sportive et Culturelle Gagnac Cyclisme	31	1976	V	4
7641	\N	GRIMAUD	Sébastien	H	Association Sportive Villemur Cyclisme	31	2002	J	2
7650	\N	GUINET	Jonathan	H	Balma Olympique Cyclisme	31	1981	S	4
7660	\N	HELIAS	Johann	H	Comité FSGT 31	31	1988	S	3
7670	\N	JAHIER	Marc François	H	Comité FSGT 82	82	1974	V	4
7680	\N	JONIN	Daniel	H	Sorèze Vélo-Club	81	1969	SV	4
7690	\N	KOCH	Christian	H	Association Sportive Muret Cyclisme	31	1967	SV	4
7700	\N	LACOUR	Guillaume	H	Association Sportive Muret Cyclisme	31	\N	0	NL
7710	\N	LAGRANGE	Philippe	H	Association Cycliste Le Fousseret	31	\N	0	NL
7720	\N	LAPLAZA	Christohe	H	Etoile Sportive Gimont Cyclo	32	1980	S	4
7730	\N	LATAPIE	Christophe	H	L'Union Cycliste 31	31	1969	SV	4
7740	\N	LE BOZEC	David	H	NL	81	\N	0	NL
7750	\N	LECUYER	Thibault	H	Fonbeauzard Vélo-Club	31	1987	S	4
7760	\N	LEVALLET	Kévin	H	Vélo-Club Avranches	50	1994	S	NL
7770	\N	LOHIER	Sephan	H	Empalot Vélo-Club	31	1970	V	4
7780	\N	LOUGE	Alexis	H	Cyclo-Club Castanéen	31	1967	SV	4
7790	\N	MALLERET	Gregory	H	Union Vélocipédique Mazamétaine	81	\N	0	3
7801	\N	MARGARIDENC	Thomas	H	NL	31	\N	0	NL
7811	\N	MARTIN	Lionel	H	Club Cycliste Le Boulou	66	\N	0	5
7820	\N	MARTY	Clément	H	Vélo-Sport Castrais	81	1954	A	5
7830	\N	MAT	Camille	H	Team Jallet Auto	73	1975	V	2
7840	\N	MENDONCA	Christian	H	Espagne	\N	\N	0	NL
7850	\N	MICARD	Patrick	H	Vélo-Club Villefranchois	31	1957	A	5
7860	\N	MIQUEL	Jérôme	H	Tolosa Cycling Team	31	1979	V	2
7870	\N	MONS	Céline	F	Gourdan Polignan Comminges Cycliste	31	\N	0	NL
7880	\N	MORTON	Iain	H	Vélo-Club Blayais	81	\N	0	4
7890	\N	NAVARRO	José	H	TOAC Cyclisme	31	1973	V	4
7900	\N	OURCIVAL	Patrick	H	TOAC Cyclisme	31	1961	SV	5
7910	\N	PALCY	Eddy	H	Union Sportive Fronton Cyclisme	31	1972	V	4
7920	\N	PASCAL	Jean-Luc	H	Association Sportive et Culturelle Gagnac Cyclisme	31	1965	SV	5
7930	\N	PENAVAYRE	Julien	H	JT Cycles Racing	31	1989	S	3
7940	\N	PERRIER	Romain	H	L'Union Cycliste 31	31	1983	S	3
7950	\N	PEYTAVI	Bastien	H	Club Olympique Carbonnais Cyclisme	31	1999	E	2
7960	\N	PINTAT	Alain	H	Vélo Occitan Club	31	1958	A	5
7970	\N	PORTOLES	Patrick	H	Association Guidon Verdunois	31	1952	A	NL
7980	\N	QUAGHEBEUR	Quentin	H	Cyclo-Club Mazérien	9	1990	S	2
7990	\N	RAMES	Jean-Luc	H	Cyclo-Club Castanéen	31	1967	SV	5
8000	\N	RELLIER	Florimond	H	Vertical Bike Muret	31	1989	S	NL
8010	\N	RHODES	Christian	H	Club Olympique Carbonnais Cyclisme	31	1975	V	4
8021	\N	RIVES	Serge	H	TOAC Cyclisme	31	1957	A	5
8031	\N	ROGER	Francis	H	Club Cycliste Le Boulou	66	1968	SV	2
8041	\N	ROUBERT	Frédéric	H	Vélo-Sport Castrais	81	\N	0	5
8051	\N	ROUX	Guilhem	H	Union Vélocipédique Mazamétaine	81	1978	V	2
8061	\N	SAGE	Stéphane	H	NL	82	\N	0	NL
8071	\N	SALLES	Grégory	H	Vélo-Club CPRS Pins-Justaret/Vilatte	31	1977	V	3
8081	\N	SAUX	Pierre	H	ASPTT Gaillac Cyclisme	81	\N	0	3
8091	\N	SEGUELA	Christian	H	Association Sportive et Culturelle Gagnac Cyclisme	31	1945	A	5
7286	\N	BIAU	Jordy	H	Association Sportive et Culturelle Gagnac Cyclisme	31	1992	S	3
7296	\N	BOCQUIER	Jocelyn	H	Association Saint-Nauphary Vélo Sport	82	\N	0	4
7306	\N	BORDES	Laurent	H	Clarac Comminges Cyclisme	31	\N	0	NL
7316	\N	BOYER	Benjamin	H	Vélo-Club CPRS Pins-Justaret/Vilatte	31	1993	S	3
7326	\N	BROCARD	Philippe	H	NL	81	\N	0	NL
7336	\N	CABAL	Christian	H	Cyclo Fonsorbais	31	1967	SV	3
7346	\N	CARILLO	Frédéric	H	Sorèze Vélo-Club	81	\N	0	2
7357	\N	CASTAING	Paul	H	Balma Olympique Cyclisme	31	1969	SV	4
7367	\N	CAZALS	Jean-Luc	H	Union Sportive Aviation Latécoère	31	1963	SV	5
7377	\N	CHAUBARD	Serge	H	Clarac Comminges Cyclisme	31	1957	A	5
7387	\N	CINCHETTI	Cédric	H	Club Olympique Carbonnais Cyclisme	31	1972	V	3
7397	\N	COLETTI	Gérard	H	Cyclo-Club Castanéen	31	1955	A	5
7407	\N	COP	Matthias	H	Team Ariège Cycles	9	1983	S	NL
7417	\N	COSTE	Vincent	H	Association Sportive Muret Cyclisme	31	1986	S	4
7427	\N	COUTINHO	Philippe	H	Saint-Gaudens Cyclisme Comminges	31	1967	SV	NL
7437	\N	DALL'ARMI	Jean-Marc	H	Association Saint-Nauphary Vélo Sport	82	1964	SV	5
7447	\N	DARBAS	Patrick	H	Association Sportive des Autobus Toulousains	31	1962	SV	5
7457	\N	DAUZATS	David	H	Tolosa Cycling Team	31	1988	S	4
7467	\N	DEBLIQUY	Daniel	H	Union Sportive Colomiers Cyclisme	31	1968	SV	5
7477	\N	DELCOURT	Jean-Jacques	H	Vélo-Club Cambonnais	81	\N	0	2
7487	\N	DEMOY	Francis	H	Balma Vélo-Sprint	31	1965	SV	4
7497	\N	DEVEZE	Daniel	H	Association Sportive des Autobus Toulousains	31	1972	V	2
7507	\N	DORME	Laurent	H	Cercle Athlétique Castelsarrasinois Cyclisme	82	1992	S	2
7517	\N	DUCHAINE	Pierre	H	Mirebeau Sport Cyclisme	21	1949	A	5
7527	\N	DUPIN	Guillaume	H	Roue Libre Saman	31	\N	0	NL
7537	\N	EKICIER	Nicolas	H	Balma Olympique Cyclisme	31	1987	S	3
7547	\N	FABREGA	Jérôme	H	Association Sportive Muret Cyclisme	31	\N	0	NL
7557	\N	FAVA	Pierrick	H	Association Sportive Villemur Cyclisme	31	2003	C	5
7567	\N	FERRE	Yannick	H	Association Sportive Muret Cyclisme	31	\N	0	NL
7577	\N	FORTIER-DURAND	Grégory	H	Balma Vélo-Sprint	31	1971	V	4
7588	\N	GABRIEL	Jean-Marc	H	Vélo-Sport Castelnaudary	11	\N	0	3
7598	\N	GARCIA	Abel	H	Avenir Cycliste Auterivain	31	1947	A	5
7608	\N	GEAY	Michel	H	Fonbeauzard Vélo-Club	31	\N	0	NL
7618	\N	GIRERD	Bernard	H	Vélo-Club Roquettois Omnisports	31	1955	A	5
7628	\N	GOUPILLEAU	Fabrice	H	NL	31	1958	A	NL
7638	\N	GREIN	Patrick	H	Saint-Juéry Olympique Cyclisme	81	\N	0	5
7648	\N	GUILBERT	Patrice	H	Association Sportive Muret Cyclisme	31	\N	0	NL
7658	\N	HEARNE	Andrew	H	Vélo-Club Blayais	81	\N	0	5
7668	\N	JABER	Sami	H	Cyclo-Club Castanéen	31	1974	V	4
7678	\N	JOLIBERT	Pierre	H	Association Sportive Muret Cyclisme	31	1962	SV	5
7688	\N	KHERFOUCHE	Arnaud	H	Association Sportive et Culturelle Gagnac Cyclisme	31	1975	V	NL
7698	\N	LACOMBE	Valentin	H	Cyclo Fonsorbais	31	1998	E	4
7708	\N	LAGORCE	Bernard	H	Avenir Cycliste Auterivain	31	1953	A	5
7718	\N	LANSON	Guillaume	H	NL	31	\N	0	NL
7728	\N	LASSUS	Alain	H	Saint-Gaudens Cyclisme Comminges	31	1966	SV	NL
7738	\N	LAVIELLE	Denis	H	Balma Vélo-Sprint	31	1963	SV	5
7748	\N	LEBOUVIER	Raymond	H	Balma Vélo-Sprint	31	1954	A	5
7758	\N	LESTRUHAUT	Alexandre	H	Fonbeauzard Vélo-Club	31	1984	S	4
7769	\N	LOCCI	Serge	H	L'Union Cycliste 31	31	1956	A	5
7779	\N	LOUGARRE	Philippe	H	Longages Espoir Cycliste	31	\N	0	NL
7789	\N	MALIE	Christian	H	Avenir Cycliste Rabastinois	81	1960	SV	5
7799	\N	MARCATO	René	H	Cyclo-Club Castanéen	31	1943	A	5
7809	\N	MARTIN	Florian	H	Bruguières Vélo-Club	31	1997	E	2
7819	\N	MARTRE	Mathilde	F	Association Sportive Carcassonne Cyclisme	11	2003	FC	NL
7829	\N	MASSOT	Robert	H	Team Master Pro 82	82	1956	A	5
7839	\N	MEESCHAERT	Alexandre	H	Vélo-Club Roquettois Omnisports	31	1981	S	2
7849	\N	METRO	Alex	H	JT Cycles Racing	31	1997	E	3
7859	\N	MIQUEL	Daniel	H	Association Cycliste Le Fousseret	31	1959	A	2
7869	\N	MONFORT	Stéphane	H	Sorèze Vélo-Club	81	\N	0	4
7879	\N	MOREL	Alain	H	Union Sportive Vacquiers	31	1962	SV	NL
7889	\N	NATUREL	Claude	H	Association Sportive Muret Cyclisme	31	1954	A	5
7899	\N	OLLIER	Patrice	H	Union Sportive Aviation Latécoère	31	1964	SV	4
7909	\N	PALACIAN	Pascal	H	Vélo-Club CPRS Pins-Justaret/Vilatte	31	1973	V	4
7919	\N	PASA	Jean-Louis	H	Cyclo-Club Castanéen	31	1953	A	5
7929	\N	PELLIER	Jean-Olivier	H	L'Union Cycliste 31	31	1970	V	2
7939	\N	PERRIE	Mathieu	H	TOAC Cyclisme	31	1987	S	3
7949	\N	PEYRE	Jérôme	H	Tolosa Cycling Team	31	1975	V	2
7959	\N	PINASA	Ludovic	H	Clarac Comminges Cyclisme	31	1979	V	4
7969	\N	POPOVICI	Dan	H	Cyclo-Club Castanéen	31	1976	V	4
7979	\N	PUJOL	Pascal	H	Vélo-Club CPRS Pins-Justaret/Vilatte	31	1974	V	4
7989	\N	RAGOT	Thierry	H	Balma Olympique Cyclisme	31	1964	SV	4
7999	\N	REGNIER	Rudy	H	Gourdan Polignan Comminges Cycliste	31	\N	0	NL
8009	\N	REY	Philippe	H	Cyclo-Club Toulouse Lardenne	31	1963	SV	5
8019	\N	RIGAUD	Robert	H	Association Sportive Carcassonne Cyclisme	11	1946	A	5
8029	\N	RODRIGUEZ	Lionel	H	Centre Sportif Omnisport Ariègeois 09	9	1975	V	4
8039	\N	ROSSE	Olivier	H	Vélo-Club CPRS Pins-Justaret/Vilatte	31	1973	V	2
8049	\N	ROUSSY	Florent	H	Sorèze Vélo-Club	81	\N	0	2
8059	\N	SABOT	Germain	H	NL	31	\N	0	NL
8069	\N	SALLEE	Mathieu	H	L'Union Cycliste 31	31	1985	S	4
8079	\N	SAURIAT	Thierry	H	Balma Vélo-Sprint	31	1969	SV	4
8089	\N	SCIACCHITANO	Benoit	H	Union Sportive Fronton Cyclisme	31	1990	S	3
8099	\N	SIE	Christian	H	Lavaur Vélo-Club	81	1958	A	4
7287	\N	BIAU	Romain	H	Vélo-Sport Castrais	81	\N	0	4
7297	\N	BODART	Philippe	H	Team Exper'Cycle	82	\N	0	4
7307	\N	BOTTEAU	Olivier	H	Club Cycliste Le Boulou	66	\N	0	4
7317	\N	BOYER	Benoit	H	Balma Vélo-Sprint	31	1978	V	4
7327	\N	BRONDINO	Georges	H	Cyclo-Club Castanéen	31	1957	A	5
7337	\N	CABAL	Juliette	F	Cyclo Fonsorbais	31	2002	FJ	5
7347	\N	CARLIER	Alexandre	H	Association Sportive Muret Cyclisme	31	1985	S	4
7355	\N	CASTET	Arnaud	H	Sorèze Vélo-Club	81	1972	V	4
7365	\N	CAYRON	Stéphane	H	Amicale Cyclo Escalquens	31	1973	V	4
7375	\N	CHARLET	Jean-François	H	Sorèze Vélo-Club	81	\N	0	4
7385	\N	CHRISTOPHE	Robin	H	TOAC Cyclisme	31	1993	S	2
7395	\N	CLOT	Patrick	H	Cercle Athlétique Castelsarrasinois Cyclisme	82	1974	V	2
7404	\N	COMMENGE	Sébastien	H	Camarade Sports & Loisirs	9	\N	0	5
7414	\N	COSIO	Dominique	H	Vélo-Club Saint-Cyprien	47	\N	0	5
7424	\N	COUSTEL	Philippe	H	L'Union Cycliste 31	31	1967	SV	5
7434	\N	DA SILVA	Manuel	H	Vélo-Club Roquettois Omnisports	31	1968	SV	5
7444	\N	DANIEAU	Victor	H	Vélo-Club Roquettois Omnisports	31	1998	E	3
7454	\N	DAUNES	Hervé	H	Montréjeau Cyclo-Club	31	\N	0	NL
7464	\N	DE ZERBI	Antoine	H	Sorèze Vélo-Club	81	1977	V	3
7474	\N	DELAHAYE	Robin	H	Vélo-Club Roquettois Omnisports	31	2005	M	C
7485	\N	DELUGRE	Jean-Yves	H	NL	31	1987	S	NL
7495	\N	DEVELAY	David	H	Vélo-Club Cambonnais	81	\N	0	3
7505	\N	DOMENECH	Florian	H	Béziers Méditerranée Cyclisme	34	\N	0	2
7515	\N	DUBAND	Régis	H	Balma Vélo-Sprint	31	1974	V	3
7526	\N	DUPIN	Denis	H	Roue Libre Saman	31	\N	0	NL
7535	\N	DUTOUR	Gilles	H	Union Sportive Castelsagrat Cyclisme	82	\N	0	5
7544	\N	ESTABES	Florian	H	Association Saint-Nauphary Vélo Sport	82	\N	0	NL
7554	\N	FAURESSE	Hugo	H	TOAC Cyclisme	31	2003	C	C
7564	\N	FERNANDEZ	Benoit	H	Villeneuve Cycliste	31	1996	S	2
7574	\N	FONCES	Pierre-Antoine	H	NL	31	\N	0	NL
7584	\N	FOURNIER	Alain	H	Béziers Méditerranée Cyclisme	34	\N	0	4
7594	\N	GALMARD	Claude	H	L'Union Cycliste 31	31	1958	A	4
7604	\N	GAUDEAUX	Fabrice	H	Association Sportive et Culturelle Gagnac Cyclisme	31	1966	SV	NL
7614	\N	GIBELOT	Alexandre	H	Avenir Cyclisme Bastidien (Labastide du Tarn)	82	1981	S	4
7624	\N	GONZALEZ	Alberto	H	Balma Vélo-Sprint	31	1993	S	5
7634	\N	GRASSET	Daniel	H	Vélo-Club Larra	31	1966	SV	5
7644	\N	GROSLIER	Guillaume	H	Vélo-Club Mauvezinois	32	1986	S	3
7654	\N	HABEMONT	Jean-Lou	H	Villeneuve Cycliste	31	1983	S	3
7664	\N	HOLE	Manuel	H	Cyclo-Club Castanéen	31	1969	SV	4
7674	\N	JEAN MARIE	Sébastien	H	Sorèze Vélo-Club	81	1977	V	4
7684	\N	JOURDAN	Cédric	H	Vélo-Club Roquettois Omnisports	31	1971	V	4
7693	\N	LABOUREL	Frédéric	H	TOAC Cyclisme	31	1968	SV	3
7703	\N	LAFFARGUE	Alain	H	TOAC Cyclisme	31	1967	SV	2
7713	\N	LAMONEYRIE	Matthieu	H	La Pancarte	81	\N	0	2
7723	\N	LARRIPA	Bruno	H	Vélo-Club CPRS Pins-Justaret/Vilatte	31	1965	SV	4
7733	\N	LAURENT	Alexis	H	Club Olympique Carbonnais Cyclisme	31	1996	S	3
7744	\N	LE FOLL	Laurent	H	Balma Vélo-Sprint	31	1972	V	4
7754	\N	LENOIR	David	H	Empalot Vélo-Club	31	\N	0	3
7763	\N	LIECHTI	Cyrille	H	Association Sportive Muret Cyclisme	31	1967	SV	5
7774	\N	LOPEZ	Clément	H	Cercle Athlétique Castelsarrasinois Cyclisme	82	1997	E	NL
7784	\N	MACIOCE	Romain	H	Association Sportive Villemur Cyclisme	31	\N	0	NL
7794	\N	MANDIRAC	Matthieu	H	Saint-Juéry Olympique Cyclisme	81	\N	0	2
7804	\N	MARQUEYSSAT	Théo	H	Vélo Club Mondonvillois	31	2001	J	3
7814	\N	MARTIN	Yannick	H	Team Exper'Cycle	82	\N	0	4
7824	\N	MASCARAS	Laurent	H	Cercle Athlétique Castelsarrasinois Cyclisme	82	1977	V	2
7834	\N	MAUREL	Thomas	H	Balma Vélo-Sprint	31	1976	V	4
7844	\N	MENEVIS	Hervé	H	Cyclo-Club Castanéen	31	1970	V	4
7854	\N	MICHELS	Jérôme	H	Balma Vélo-Sprint	31	1963	SV	5
7864	\N	MOLA	Pierre	H	Association Sportive Muret Cyclisme	31	1971	V	3
7873	\N	MONTEGUT	Gauthier	H	Association Cycliste Le Fousseret	31	2003	C	C
7883	\N	MOURLANETTE	Pierre	H	TOAC Cyclisme	31	1965	SV	2
7893	\N	NICOMETTE	Vincent	H	Empalot Vélo-Club	31	1968	SV	2
7903	\N	OYARSABAL	Jean-Philippe	H	Association Sportive Carcassonne Cyclisme	11	\N	0	3
7913	\N	PALMISANO	Salvatore	H	Avenir Cyclisme Bastidien (Labastide du Tarn)	82	1949	A	5
7923	\N	PAUL	Fabrice	H	Balma Vélo-Sprint	31	1965	SV	5
7933	\N	PENOT	Xavier	H	Balma Vélo-Sprint	31	1973	V	3
7943	\N	PETIT	Sébastien	H	TOAC Cyclisme	31	1980	S	3
7953	\N	PHILIPPE	Aurélien	H	Association Sportive Carcassonne Cyclisme	11	\N	0	3
7963	\N	PLANAS	Christophe	H	Association Sportive Carcassonne Cyclisme	11	\N	0	3
7973	\N	PRAT	Quentin	H	Saint-Gaudens Cyclisme Comminges	31	1995	S	NL
7983	\N	RABAJOIE	Pierre	H	JT Cycles Racing	31	1991	S	3
7993	\N	RAULIN	Hervé	H	Empalot Vélo-Club	31	1960	SV	4
8003	\N	REMONT	Daniel	H	Amicale Cycliste Tournefeuille	31	1967	SV	5
8013	\N	RIBEIRO DA CRUZ	Mathias	H	Amicale Cycliste Tournefeuille	31	2000	E	NL
8023	\N	ROBERT	Jean-François	H	Sorèze Vélo-Club	81	\N	0	5
8033	\N	ROLLEAU	Roland	H	Team Master Pro 82	82	1944	A	5
8043	\N	ROUGE	Cyril	H	Sorèze Vélo-Club	81	1981	S	3
8053	\N	ROZADA	Francisco	H	Cyclo-Club Castanéen	31	1950	A	5
8063	\N	SAINT-MACARY	Cassien	H	Cyclo-Club Castanéen	31	1979	V	2
8073	\N	SANCHEZ	Fabrice	H	Association Sportive Muret Cyclisme	31	\N	0	NL
8083	\N	SCALCON	Joël	H	Association Cycliste Le Fousseret	31	\N	0	NL
8093	\N	SENSEBY	Daniel	H	Club Olympique Carbonnais Cyclisme	31	1957	A	5
7687	\N	JULIAN	Jean-Michel	H	Association Sportive des Autobus Toulousains	31	1962	SV	5
7697	\N	LACOMBE	Christophe	H	Thales Inter Sports	31	1976	V	3
7707	\N	LAFORGUE	Gérémie	H	Cyclo-Club Mazérien	9	\N	0	2
7717	\N	LANNES	Jérôme	H	NL	82	\N	0	NL
7727	\N	LARUELLE	Philippe	H	Association Sportive et Culturelle Gagnac Cyclisme	31	1965	SV	5
7737	\N	LAUSSEL	Pierre	H	Vélo-Sport Saint-Affrique	12	\N	0	4
7747	\N	LEBAS	Jean-Yves	H	Thales Inter Sports	31	1962	SV	5
7757	\N	LESCURE	Yohan	H	Plaisance du Touch Amicale Cyclisme	31	1997	E	5
7767	\N	LLAGONNE	Stéphane	H	Club Cycliste Le Boulou	66	1975	V	4
7777	\N	LOT	Eric	H	Vélo Occitan Club	31	1967	SV	4
7787	\N	MAGONTHIER	Christian	H	L'Union Cycliste 31	31	1970	V	3
7797	\N	MANFRIN	Jean-Marc	H	Club Olympique Carbonnais Cyclisme	31	1963	SV	4
7807	\N	MARTEAU	Fabien	H	Avenir Cycliste Rabastinois	81	1979	V	5
7817	\N	MARTINEZ	Frédéric	H	Association Sportive et Culturelle Gagnac Cyclisme	31	1973	V	4
7827	\N	MASSE	René	H	Amicale Cycliste Tournefeuille	31	1950	A	5
7837	\N	MC KENZIE	John	H	Association Cycliste Le Fousseret	31	\N	0	NL
7847	\N	MERLIER	Cédric	H	Saint-Juéry Olympique Cyclisme	81	1979	V	4
7857	\N	MILHORAT	Yannick	H	Association Cycliste Le Fousseret	31	1974	V	4
7867	\N	MONCASSIN	Jonathan	H	Vélo-Club Mauvezinois	32	1984	S	3
7877	\N	MORANCHO	Frédéric	H	L'Union Cycliste 31	31	1969	SV	2
7887	\N	NARDARI	Thierry	H	Balma Vélo-Sprint	31	1977	V	4
7897	\N	ODIER	Vincent	H	La Pancarte	81	1991	S	3
7907	\N	PAGES	Lionel	H	Saint-Juéry Olympique Cyclisme	81	\N	0	4
7917	\N	PAPORE	Franck	H	Comité FSGT 31	31	1976	V	4
7927	\N	PEACOCK	Olivier	H	Cyclo-Club Léguevin	31	1979	V	4
7937	\N	PERFETTI	Lisandre	H	Etoile Cycliste Bastiaise	20	2004	C	C
7947	\N	PETROLINI	Stéphane	H	Gourdan Polignan Comminges Cycliste	31	\N	0	NL
7957	\N	PICOT	Denis	H	Cyclo-Club Castanéen	31	1963	SV	5
7967	\N	POITEVIN	Alex	H	TOAC Cyclisme	31	1971	V	4
7977	\N	PUGNET	Alain	H	TOAC Cyclisme	31	1945	A	5
7987	\N	RACAUD	Julien	H	Association Sportive Muret Cyclisme	31	\N	0	NL
7997	\N	RAYNAUD	Yannick	H	Association Sportive Carcassonne Cyclisme	11	1983	S	3
8007	\N	RESPAUT	Didier	H	Club Cycliste Le Boulou	66	1957	A	4
8017	\N	RIEGEL	Benoit	H	Vittel Triathlon	88	1973	V	NL
8027	\N	ROCA	Henri	H	Club Cycliste Le Boulou	66	\N	0	4
8037	\N	ROQUES	Olivier	H	Club Olympique Carbonnais Cyclisme	31	1975	V	4
8047	\N	ROUSSIN	Jean	H	Villeneuve Cycliste	31	1969	SV	4
8057	\N	RULLAC	Marc	H	Sorèze Vélo-Club	81	\N	0	1
8067	\N	SAKIROFF	Emmanuel	H	Lavaur Vélo-Club	81	\N	0	4
8077	\N	SARROU	Ludovic	H	Béziers Méditerranée Cyclisme	34	\N	0	1
8087	\N	SCHURDEVIN	Alain	H	Club Cycliste Le Boulou	66	\N	0	5
8097	\N	SEVIN	Dorian	H	Gourdan Polignan Comminges Cycliste	31	\N	0	NL
8107	\N	SOLANA	Guillaume	H	Plaisance du Touch Amicale Cyclisme	31	1980	S	2
8117	\N	SOUVERVILLE	Fabien	H	Plaisance du Touch Amicale Cyclisme	31	1984	S	2
8127	\N	TARRICO	Fabrice	H	Canohes Avenir Cyclisme	66	1969	SV	5
8137	\N	THIEBAULT	Dominique	H	Union Cycliste Tullins	38	\N	0	5
8147	\N	THUILLIE	Mickaël	H	Bruguières Vélo-Club	31	1999	E	3
8157	\N	TORREGROSA	Olivier	H	Union Sportive Aviation Latécoère	31	1976	V	4
8167	\N	TRUQUET	Cédric	H	Union Sportive Aviation Latécoère	31	1975	V	4
8177	\N	VAN DER WAL 	Yannick	H	Saint-Juéry Olympique Cyclisme	81	\N	0	4
8187	\N	VERDONCKT	Benjamin	H	La Pancarte	81	\N	0	2
8197	\N	VIDAL	Laurent	H	Albi Vélo-Sport	82	1983	S	NL
8208	\N	VILLARY	Olivier	H	Balma Vélo-Sprint	31	1964	SV	6
8218	\N	ZAMUNER	Karine	F	Clarac Comminges Cyclisme	31	\N	0	17
7689	\N	KLEITZ	Mickaël	H	Association Saint-Nauphary Vélo Sport	82	1996	S	3
7699	\N	LACOMME	Chloé	F	Club Olympique Carbonnais Cyclisme	31	2004	FC	C
7709	\N	LAGRANGE	Alain	H	Camarade Sports & Loisirs	9	1960	SV	5
7719	\N	LAPEYRE	Martin	H	TOAC Cyclisme	31	1984	S	2
7729	\N	LASSUS	Michaël	H	NL	31	1982	S	NL
7739	\N	LAVIGNAC	Matthieu	H	Cercle Athlétique Castelsarrasinois Cyclisme	82	2002	J	NL
7749	\N	LECOEUR-WEISS	Eliot	H	Vélo-Club CPRS Pins-Justaret/Vilatte	31	2003	C	C
7759	\N	LETUÉ	Jérémy	H	Club Cycliste Le Boulou	66	\N	0	1
7768	\N	LOGUT	Loic	H	NL	81	\N	0	NL
7778	\N	LOUER	Patrick	H	Empalot Vélo-Club	31	1964	SV	4
7788	\N	MALBREIL	Eric	H	Cercle Athlétique Castelsarrasinois Cyclisme	82	1969	SV	2
7798	\N	MANSAS	Jean-Luc	H	Balma Olympique Cyclisme	31	1967	SV	2
7808	\N	MARTEL	Jean-Claude	H	Vélo-Club CPRS Pins-Justaret/Vilatte	31	1968	SV	4
7818	\N	MARTINEZ	Raphaël	H	Association Sportive Carcassonne Cyclisme	11	\N	0	4
7828	\N	MASSOMPIERRE	Thierry	H	Association Sportive et Culturelle Gagnac Cyclisme	31	1966	SV	5
7838	\N	MC KENZIE	Jordan	H	Association Cycliste Le Fousseret	31	\N	0	NL
7848	\N	METRO	Achille	H	JT Cycles Racing	31	1995	S	1
7858	\N	MILLIGAN	John	H	Montréjeau Cyclo-Club	31	\N	0	NL
7868	\N	MONDY	Patrick	H	L'Union Cycliste 31	31	1962	SV	5
7878	\N	MOREELS	Aymeric	H	Union Sportive Fronton Cyclisme	31	\N	0	NL
7888	\N	NARDO	Nicolas	H	TOAC Cyclisme	31	1977	V	2
7898	\N	OLLIER	Jean-Christophe	H	Saint-Gaudens Cyclisme Comminges	31	1976	V	NL
7908	\N	PAISNEL	Alain	H	Union Sportive Vacquiers	31	\N	0	NL
7918	\N	PARROU	Jean-Luc	H	Cyclo-Club Castanéen	31	1968	SV	5
7928	\N	PELAUT	Bruno	H	Association Sportive Villemur Cyclisme	31	1970	V	4
7938	\N	PERIE	Christophe	H	Guidon Sportif Coursan/Narbonne	11	\N	0	3
7948	\N	PETROLINI	Ugo	H	Gourdan Polignan Comminges Cycliste	31	\N	0	NL
7958	\N	PIERRON	Raphaël	H	Plaisance du Touch Amicale Cyclisme	31	1968	SV	2
7968	\N	PONT	Patrice	H	Vélo-Club Cambonnais	81	\N	0	2
7978	\N	PUJOL	Joël	H	Saint-Gaudens Cyclisme Comminges	31	1970	V	NL
7988	\N	RADENAC	Emmanuel	H	Cyclo-Club Castanéen	31	1980	S	2
7998	\N	RECULLEZ	Nicolas	H	NL	31	\N	0	NL
8008	\N	REY	Gilles	H	Balma Vélo-Sprint	31	1973	V	5
8018	\N	RIGAIL	Thierry	H	Empalot Vélo-Club	31	1966	SV	4
8028	\N	ROCHAIS	Sylvain	H	Bruguières Vélo-Club	31	1982	S	3
8038	\N	ROSSE	Erine	F	Vélo-Club CPRS Pins-Justaret/Vilatte	31	2003	FC	C
8048	\N	ROUSSIN	Pierre	H	Villeneuve Cycliste	31	2003	C	C
8058	\N	SABATHIER	Nicolas	H	Association Sportive et Culturelle Gagnac Cyclisme	31	1984	S	4
8068	\N	SALGADO	Daniel	H	NL	82	\N	0	NL
8078	\N	SARTORI	Jérôme	H	Vélo-Club CPRS Pins-Justaret/Vilatte	31	1973	V	2
8088	\N	SCHUTZ	René	H	L'Union Cycliste 31	31	1952	A	5
8098	\N	SICARD	Serge	H	Vélo-Club Blayais	81	1956	A	5
8108	\N	SOLER	Diego	H	Team Montagnac Avenir Cycliste	34	\N	0	4
8118	\N	STOLL	Dylan	H	Team Exper'Cycle	82	1994	S	2
8128	\N	TARROUX	Alain	H	Association Sportive Muret Cyclisme	31	1954	A	NL
8138	\N	THIEBAUT	Jean-Philippe	H	Vélo Occitan Club	31	1969	SV	5
8148	\N	TIRARD-COLLET	Alexandre	H	Balma Vélo-Sprint	31	1977	V	3
8158	\N	TORRES	Olivier	H	L'Union Cycliste 31	31	1973	V	4
8168	\N	TURROQUES	Guillaume	H	Association Sportive Villemur Cyclisme	31	\N	0	NL
8178	\N	VAN SCHENDEL	Maxime	H	Guidon Sprinter Club de  Blagnac	31	\N	0	NL
8188	\N	VERGE	Gilles	H	Montréjeau Cyclo-Club	31	\N	0	NL
8198	\N	VIDAL	Michel	H	Sorèze Vélo-Club	81	1963	SV	5
8207	\N	VINEL	Ludovic	H	Association Sportive et Culturelle Gagnac Cyclisme	31	1991	S	7
8217	\N	ZAMUNER	Albert	H	Clarac Comminges Cyclisme	31	1952	A	16
8101	\N	SIERRA	Guillaume	H	Clarac Comminges Cyclisme	31	\N	0	NL
8111	\N	SOUBIE	Guillaume	H	Association Sportive Muret Cyclisme	31	1994	S	3
8121	\N	SUIF	Gilbert	H	Vélo-Club Roquettois Omnisports	31	1950	A	2
8131	\N	TEMBLIN	Benoit	H	Toulouse Université Club Triathlon	31	\N	0	NL
8141	\N	THIESSELIN	Daniel	H	Montréjeau Cyclo-Club	31	\N	0	NL
8151	\N	TISTOUNET	Jérôme	H	Saint-Gaudens Cyclisme Comminges	31	1975	V	NL
8161	\N	TREIL	David	H	Sorèze Vélo-Club	81	1982	S	4
8171	\N	VACQUIE	Jean-Marc	H	L'Union Cycliste 31	31	1963	SV	5
8181	\N	VASSAL	Maryline	F	Sorèze Vélo-Club	81	\N	0	NL
8191	\N	VERGER	Thierry	H	Vélo-Club Roquettois Omnisports	31	1962	SV	5
8201	\N	VIGNAU	Mickael	H	Guidon Fuxeen	9	\N	0	NL
8211	\N	VORONOVAS	Jean-Claude	H	Team Exper'Cycle	82	\N	0	10
8221	\N					\N	\N
8103	\N	SILBERSTEIN	David	H	Comité FSGT 31	31	1982	S	3
8113	\N	SOULA	Alain	H	Cyclo-Club Castanéen	31	1962	SV	5
8123	\N	SURIER	François	H	Cyclo-Club Castanéen	31	1964	SV	5
8133	\N	TEYSSEDOU	Serge	H	Balma Vélo-Sprint	31	1961	SV	4
8143	\N	THOA	Thierry	H	TOAC Cyclisme	31	1964	SV	4
8153	\N	TOCQUEVILLE DE PASTORS	Alexandre	H	JT Cycles Racing	31	1986	S	3
8163	\N	TRINDADE	Nicolas	H	Vélo-Sport Castrais	81	\N	0	4
8173	\N	VALCARCEL	Estéban	H	Cyclo Fonsorbais	31	1978	V	3
8183	\N	VAYSSIER	Sébastien	H	Balma Vélo-Sprint	31	\N	0	NL
8193	\N	VERISSIMO DE MORAES	Lenivaldo	H	Association Sportive et Culturelle Gagnac Cyclisme	31	1983	S	4
8204	\N	VIGNAUX	Ylan	H	Grupetto Club	31	1998	E	2
8214	\N	WINER	Pascal	H	Vélo-Club Roquettois Omnisports	31	1992	S	13
8224	\N					\N	\N
8109	\N	SOLIGNAC	Thomas	H	Cercle Athlétique Castelsarrasinois Cyclisme	82	\N	0	NL
8119	\N	STOLL	Steevy	H	Team Exper'Cycle	82	2000	E	2
8129	\N	TEATTINI	Bruno	H	Equipe CMI	82	\N	0	2
8139	\N	THIEBAUT	Tom	H	Vélo Occitan Club	31	2002	J	4
8149	\N	TISSIER-GRANIER	Clément	H	Association Cycliste Le Fousseret	31	\N	0	NL
8159	\N	TOURNADRE	Gérard	H	Saint-Chély d'Apcher Cyclisme	34	\N	0	4
8169	\N	UGOLINI	Sébastien	H	Club Olympique Carbonnais Cyclisme	31	1987	S	2
8179	\N	VANDECAVAYE	Aurore	F	Association Cycliste Le Fousseret	31	1981	FS	5
8189	\N	VERGER	Frédéric	H	Vélo-Club Roquettois Omnisports	31	1968	SV	4
8199	\N	VIDAL	Patrick	H	NL	81	\N	0	NL
8209	\N	VITTORI-LEYMARIE	Guillaume	H	Team Exper'Cycle	82	1984	S	8
8219	\N	ZANARDO	Patrice	H	Castelmayran Vélo Club	82	1959	A	18
8112	\N	SOUBIRAN	Aurélien	H	Equipe CMI	82	1985	S	2
8122	\N	SUIF	Laurent	H	Vélo-Club Roquettois Omnisports	31	1977	V	2
8132	\N	TESSAROTTO	Guy	H	Vélo-Club CPRS Pins-Justaret/Vilatte	31	1949	A	5
8142	\N	THILIETTE	Ludovic	H	JT Cycles Racing	31	1984	S	3
8152	\N	TOCAVEN	Georges	H	Association Sportive Villemur Cyclisme	31	\N	0	NL
8162	\N	TRENDER	Caroline	F	Vélo-Club Blayais	81	\N	0	5
8172	\N	VAISSIERE	Sébastien	H	NL	81	\N	0	NL
8182	\N	VAUDOIT	Laurent	H	Vélo-Club Roquettois Omnisports	31	1978	V	4
8192	\N	VERGNES	Simon	H	Sorèze Vélo-Club	81	1995	S	2
8203	\N	VIGNAUX	Matthieu	H	Guidon Fuxeen	9	\N	0	2
8212	\N	VOYEUX	Wilfrid	H	Tolosa Cycling Team	31	1984	S	11
8222	\N					\N	\N
8115	\N	SOULA	Guillaume	H	Equipe CMI	82	1969	SV	2
8125	\N	SWINKELS	Jean-Jacques	H	Association Sportive Muret Cyclisme	31	1967	SV	3
8135	\N	THEMINES	Nicolas	H	Association Sportive Muret Cyclisme	31	\N	0	NL
8145	\N	THOMAS	Florent	H	NL	81	1961	SV	2
8155	\N	TONICELLO	Mathieu	H	Tolosa Cycling Team	31	1991	S	3
8165	\N	TROUCHE	Benjamin	H	Equipe CMI	82	1984	S	2
8175	\N	VALIN	Jean-Philippe	H	Balma Vélo-Sprint	31	1965	SV	4
8185	\N	VERDEYME	Sébastien	H	Sorèze Vélo-Club	81	\N	0	3
8195	\N	VERSTIGGEL	Luc	H	Vélo Occitan Club	31	1972	V	4
8205	\N	VILA	Sébastien	H	TOAC Cyclisme	31	1981	S	4
8215	\N	WOLFF	Jean-Michel	H	Association Sportive Villemur Cyclisme	31	1973	V	14
8116	\N	SOULE	Guillaume	H	Gourdan Polignan Comminges Cycliste	31	\N	0	NL
8126	\N	TAPIA	Sébastien	H	Revel Sprinter-Club	31	1976	V	4
8136	\N	THERON	Gérard	H	Cyclo-Club Castanéen	31	1954	A	5
8146	\N	THOMAS	Jacky	H	Balma Olympique Cyclisme	31	1961	SV	2
8156	\N	TONON	Cédric	H	Association Sportive Villemur Cyclisme	31	1978	V	4
8166	\N	TROUVE	Jean-Claude	H	TOAC Cyclisme	31	1942	A	5
8176	\N	VAN ASSCHE	Nathalie	F	Camarade Sports & Loisirs	9	1979	FV	5
8186	\N	VERDIER	Emilien	H	Cyclo-Club Castanéen	31	1998	E	3
8196	\N	VICTOR	Christelle	F	TOAC Cyclisme	31	1973	FV	5
8206	\N	VILATTE	Denis	H	Vélo-Club CPRS Pins-Justaret/Vilatte	31	1965	SV	5
8216	\N	WRIGHT	Robert	H	Cyclo-Club Mazérien	9	1968	SV	15
8120	\N	SUAREZ	Ismaël	H	Vélo-Club Cambonnais	81	\N	0	1
8130	\N	TECHENE	Xavier	H	Roue Libre Saman	31	\N	0	NL
8140	\N	THIERY	Alain	H	L'Union Cycliste 31	31	1963	SV	5
8150	\N	TISSOT	Hubert	H	L'Union Cycliste 31	31	1965	SV	3
8160	\N	TOURNIER	Ludovic	H	NL	31	\N	0	NL
8170	\N	ULRICH	Marlon	H	Union Sportive Fronton Cyclisme	31	\N	0	NL
8180	\N	VANIN	Marco	H	Béziers Méditerranée Cyclisme	34	\N	0	2
8190	\N	VERGER	Michel	H	L'Union Cycliste 31	31	1955	A	5
8200	\N	VIERNE	Nicolas	H	Teyran Bike 34	34	\N	0	5
8210	\N	VOLLMER	Robin	H	Association des Sapeurs Pompiers de l'Hérault Montpellier	34	1990	S	9
8220	\N	ZAPPELLA	Bernard	H	Vélo-Sport Castelnaudary	31	\N	0	19
8134	\N	TEYSSIER	Jérôme	H	Balma Vélo-Sprint	31	1975	V	4
8144	\N	THOMAS	Colin	H	Balma Olympique Cyclisme	31	1993	S	2
8154	\N	TOMBELLE	Pol	H	Clarac Comminges Cyclisme	31	\N	0	NL
8164	\N	TRONC	Dominique	H	Vélo-Club CPRS Pins-Justaret/Vilatte	31	1957	A	5
8174	\N	VALETTE	Mathieu	H	Association des Sapeurs Pompiers de l'Hérault Montpellier	34	\N	0	3
8184	\N	VERDEL	Morgan	H	Béziers Méditerranée Cyclisme	34	\N	0	1
8194	\N	VERSEUX	Olivier	H	Amicale Cycliste Tournefeuille	31	1972	V	4
8202	\N	VIGUIER	Michel	H	L'Union Cycliste 31	31	1954	A	5
8213	\N	WEISS	Alexandre	H	Vélo-Club CPRS Pins-Justaret/Vilatte	31	1960	SV	12
8223	\N					\N	\N
7278	\N	BESSOU	Christopher	H	Montauban Cyclisme	82	\N	0	1
7289	\N	BILLIOT	Laurent	H	Association Sportive Muret Cyclisme	31	\N	0	NL
7299	\N	BONNET	Christophe	H	Vélo-Club Roquettois Omnisports	31	1975	V	2
7309	\N	BOUCLIER	Robin	H	Sorèze Vélo-Club	81	\N	0	4
7319	\N	BOYER	David	H	Association Sportive et Culturelle Gagnac Cyclisme	31	1978	V	4
7329	\N	BRUGEAU	Philippe	H	Association Sportive des Autobus Toulousains	31	1966	SV	5
7339	\N	CADEI	Jean-Pierre	H	Entente Cycliste Osny-Pontoise	95	\N	0	5
7349	\N	CARPENA	Richard	H	Beziers Méditérranée Cyclisme	11	\N	0	4
7359	\N	CASTET	Pierre	H	Club Olympique Carbonnais Cyclisme	31	1972	V	4
7369	\N	CERE	Guillaume	H	Union Vélocipédique Mazamétaine	81	\N	0	3
7379	\N	CHAVANT	Valérie	F	Association Sportive Muret Cyclisme	31	1965	FSV	5
7391	\N	CLEMENT	Franck	H	Saint-Gaudens Cyclisme Comminges	31	1971	V	2
7401	\N	COLUS	Jérôme	H	Vélo-Club Roquettois Omnisports	31	1973	V	4
7411	\N	CORBELLA	Florent	H	Team Exper'Cycle	82	\N	0	4
7421	\N	COUSINE	Jérôme	H	L'Union Cycliste 31	31	1972	V	4
7431	\N	CULLET	Thierry	H	Cycling Team Black Devil	31	\N	0	NL
7442	\N	DANIEAU	Emmanuel	H	Vélo-Club Roquettois Omnisports	31	1971	V	NL
7452	\N	DAUBRIAC	Jean-Michel	H	Centre Sportif Omnisports Ariègeois 09	9	\N	0	2
7462	\N	DE SAN NICOLAS	Eric	H	Team Exper'Cycle	82	\N	0	2
7472	\N	DELAGE	Pierre-Eric	H	Cyclo-Club Castanéen	31	1968	SV	5
7481	\N	DELIEGE	Fantin	H	NL	31	1996	S	NL
7491	\N	DESAGE	Clément	H	Balma Olympique Cyclisme	31	2001	J	4
7501	\N	D'INCAU	Sacha	H	Canohes Avenir Cyclisme	66	\N	0	C
7511	\N	DOUMENG	Jean	H	NL	31	1955	A	NL
7521	\N	DUDOGNON	Gilles	H	Association Sportive Muret Cyclisme	31	1959	A	5
7531	\N	DURBIANO	Romain	H	Association Sportive Carcassonne Cyclisme	11	1985	S	3
7541	\N	ESCUDIER	Jean-Marc	H	Cyclo-Club Castanéen	31	1964	SV	5
7551	\N	FANTUZ	Pascal	H	Amicale Cycliste Tournefeuille	31	1982	S	3
7561	\N	FENASSE	Damien	H	Balma Vélo-Sprint	31	1994	S	3
7571	\N	FIEU	Stéphane	H	Union Vélocipédique Mazamétaine	81	\N	0	3
7581	\N	FOUGERAS	Eric	H	Vélo-Club du Velay	43	\N	0	4
7591	\N	GAILLARD	David	H	Roue Libre Saman	31	\N	0	NL
7601	\N	GARDELLE	David	H	Association Cycliste Le Fousseret	31	\N	0	NL
7611	\N	GERMA	Xavier	H	Vélo-Club Roquettois Omnisports	31	1966	SV	3
7621	\N	GODARD	Frédéric	H	L'Union Cycliste 31	31	1961	SV	5
7631	\N	GRARE	Christophe	H	Avenir Cyclisme Bastidien (Labastide du Tarn)	82	\N	0	5
7642	\N	GROLIER	Mathieu	H	Tolosa Cycling Team	31	1985	S	2
7652	\N	GUYAU	Lionel	H	Vélo-Sport Castrais	81	\N	0	4
7662	\N	HERRERA	Didier	H	Canohes Avenir Cyclisme	66	1968	SV	5
7672	\N	JAUBERT	Patrick	H	Cyclo-Club Castanéen	31	1953	A	5
7682	\N	JONIN	Maël	H	Sorèze Vélo-Club	81	2003	C	C
7692	\N	LABOUILLE	Stéphane	H	Cyclo-Club Castanéen	31	1982	S	2
7702	\N	LACROIX	Ludovic	H	Roue Libre Saman	31	\N	0	NL
7712	\N	LAMBERT	David	H	Revel Sprinter-Club	31	1973	V	4
7721	\N	LARAT	Hugues	H	Balma Vélo-Sprint	31	1982	S	3
7731	\N	LATESTERE	Adrien	H	Cyclosport Casteljaloux	47	1985	S	NL
7741	\N	LE BRIS REDE	Werner	H	Cyclo-Club des Violettes Castelmauroux	31	1997	E	2
7751	\N	LEGENDRE	Damien	H	Cyclo-Club Castanéen	31	1981	S	3
7761	\N	LEYNAUD	Benoit	H	Club Cycliste Le Boulou	66	\N	0	2
7771	\N	LONGO	Laurent	H	Vélo-Club Cambonnais	81	\N	0	2
7781	\N	LOUGE	Désiré	H	Montréjeau Cyclo-Club	31	\N	0	NL
7791	\N	MALLET	Maxime	H	Saint-Gaudens Cyclisme Comminges	31	2000	E	NL
7802	\N	MARIA	Nicolas	H	NL	64	\N	0	NL
7812	\N	MARTIN	Nicolas	H	Gourdan Polignan Comminges Cycliste	31	\N	0	NL
7822	\N	MARTY	Jean-Claude	H	Balma Olympique Cyclisme	31	1954	A	4
7832	\N	MATTERN	Antoine	H	Vélo Club Sundgovia Altkirch	68	1992	S	3
7842	\N	MENEGHEL	Johan	H	Balma Olympique Cyclisme	31	1988	S	3
7852	\N	MICHAUD	Christian	H	Vélo-Club Roquettois Omnisports	31	1956	A	5
7862	\N	MIQUEL	Vincent	H	L'Union Cycliste 31	31	1974	V	4
7872	\N	MONTAUBAN	René	H	Association Cycliste Le Fousseret	31	1953	A	5
7882	\N	MOURLANETTE	Jean	H	TOAC Cyclisme	31	1991	S	3
7892	\N	NICE	Stéphane	H	TOAC Cyclisme	31	1981	S	4
7902	\N	OUVRIER	Geraud	H	Vélo Occitan Club	31	1988	S	4
7912	\N	PALMISANO	Angel	H	Association Saint-Nauphary Vélo Sport	82	\N	0	5
7922	\N	PATRIS	Nicolas	H	Union Sportive Plaisance Cyclisme	31	\N	0	NL
7932	\N	PENDERY	Léo	H	Association Sportive Carcassonne Cyclisme	11	1999	E	2
7942	\N	PESCHOUD	Clément	H	Cyclo-Club Castanéen	31	1992	S	3
7952	\N	PEYTAVY	Bernard	H	Cyclo-Club Castanéen	31	1958	A	5
7962	\N	PIRET	Rémi	H	Cercle Athlétique Castelsarrasinois Cyclisme	82	\N	0	NL
7972	\N	PRAT	Maxime	H	Saint-Gaudens Cyclisme Comminges	31	1999	E	NL
7982	\N	QUINTANA	Benjamin	H	Club Cycliste Le Boulou	66	\N	0	1
7992	\N	RAPEAUD	Mikael	H	Association Cycliste Le Fousseret	31	2006	M	NL
8002	\N	RELLIER	René	H	Union Sportive Plaisance Cyclisme	31	1989	S	3
8012	\N	RIBAS	William	H	Canohes Avenir Cyclisme	66	1971	V	5
8022	\N	ROBERT	Franck	H	Balma Olympique Cyclisme	31	1963	SV	5
8032	\N	ROGNANT	Viviane	F	Clarac Comminges Cyclisme	31	\N	0	NL
8042	\N	ROUCH	Sébastien	H	TOAC Cyclisme	31	1968	SV	2
8052	\N	ROUZAUD	Grégory	H	TOAC Cyclisme	31	1977	V	4
8062	\N	SAINT LARY	Jean-Claude	H	Montréjeau Cyclo-Club	31	\N	0	NL
8072	\N	SALVAT	Claude	H	TOAC Cyclisme	31	1950	A	5
8082	\N	SAVELIEF	Dominique	H	Amicale Cyclo Escalquens	31	1982	S	3
8092	\N	SELVE	Jean-Michel	H	Béziers Méditerranée Cyclisme	34	\N	0	1
8102	\N	SIERRA	José	H	Clarac Comminges Cyclisme	31	\N	0	NL
\.


--
-- TOC entry 2818 (class 0 OID 0)
-- Dependencies: 196
-- Name: licence_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.licence_id_seq', 8224, true);


--
-- TOC entry 2688 (class 2606 OID 16485)
-- Name: licence PK_3b4f2cda4a38b8026e4c700844c; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.licence
    ADD CONSTRAINT "PK_3b4f2cda4a38b8026e4c700844c" PRIMARY KEY (id);


-- Completed on 2019-09-20 16:10:22

--
-- PostgreSQL database dump complete
--

