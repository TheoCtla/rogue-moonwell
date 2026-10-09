// TBC original 2.4.3 (8606). Each entry keeps the Rogue tracker's format.
// Optional metadata records the original tree tier, dependencies and split levels.
const steps=[
  [10,14,'Beast Mastery','Improved Aspect of the Hawk','5/5','Vitesse des tirs sous Aspect of the Hawk.',{tier:1}],
  [15,16,'Beast Mastery','Focused Fire','2/2','Dégâts augmentés tant que le familier est actif.',{tier:2}],
  [17,18,'Beast Mastery','Improved Revive Pet','2/2','Résurrection du familier plus rapide et moins coûteuse.',{tier:2}],
  [19,19,'Beast Mastery','Endurance Training','1/5','Un point prévu : davantage de vie pour toi et ton familier.',{tier:1}],
  [20,24,'Beast Mastery','Unleashed Fury','5/5','Dégâts du familier augmentés.',{tier:3}],
  [25,29,'Beast Mastery','Ferocity','5/5','Critiques du familier ; les cinq rangs sont requis pour Frenzy.',{tier:4}],
  [30,30,'Beast Mastery','Intimidation','1/1','Étourdissement et menace du familier ; requis pour Bestial Wrath.',{tier:5}],
  [31,32,'Beast Mastery','Bestial Discipline','2/2','Régénération de focalisation du familier.',{tier:5}],
  [33,34,'Beast Mastery','Improved Mend Pet','2/2','Soin moins coûteux et dissipation sur le familier.',{tier:4}],
  [35,38,'Beast Mastery','Frenzy','4/5','Quatre points prévus sur cinq : 80 % de chance de déclencher la hâte après un critique du familier.',{tier:6,requires:['Ferocity',5]}],
  [39,44,'Beast Mastery','Animal Handler','2/2','Toucher du familier. Premier point au niveau 39, second au niveau 44.',{tier:6,levels:[39,44]}],
  [40,40,'Beast Mastery','Bestial Wrath','1/1','Puissant temps de recharge offensif du familier.',{tier:7,requires:['Intimidation',1]}],
  [41,43,'Beast Mastery','Ferocious Inspiration','3/3','Bonus de dégâts du groupe après un critique du familier.',{tier:7}],
  [45,49,'Beast Mastery',"Serpent's Swiftness",'5/5','Vitesse des attaques à distance et du familier.',{tier:8}],
  [50,50,'Beast Mastery','The Beast Within','1/1','Talent final BM : Bestial Wrath te renforce aussi. Objectif 41/0/0.',{tier:9,requires:['Bestial Wrath',1]}],
  [51,55,'Marksmanship','Lethal Shots','5/5','Chances de critique à distance.',{tier:1}],
  [56,60,'Marksmanship','Efficiency','5/5','Coût en mana des tirs et piqûres réduit pour le leveling et le PvE.',{tier:2}],
  [61,62,'Marksmanship','Go for the Throat','2/2','Tes critiques à distance rendent de la focalisation au familier.',{tier:3}],
  [63,64,'Marksmanship','Rapid Killing','2/2','Rapid Fire plus fréquent et bonus après une élimination.',{tier:3}],
  [65,65,'Marksmanship','Aimed Shot','1/1','Tir de visée ; prérequis obligatoire de Mortal Shots en TBC 2.4.3.',{tier:3}],
  [66,70,'Marksmanship','Mortal Shots','5/5','Dégâts critiques à distance augmentés. Objectif final 41/20/0.',{tier:4,requires:['Aimed Shot',1]}]
];
const trackerConfig={
  slug:'fandenibard',name:'Fandenibard',key:'moonwell-hunter-fandenibard-v1',defaultLevel:25,
  build:'41/20/0',steps,
  milestones:{30:'Intimidation',40:'Bestial Wrath',50:'The Beast Within',70:'41/20/0 terminé'},
  categories:{'Beast Mastery':'Maîtrise des bêtes · 41 points (niveaux 10 à 50)',Marksmanship:'Précision · 20 points (niveaux 51 à 70)'}
};
