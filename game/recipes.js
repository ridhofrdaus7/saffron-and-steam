export const INGREDIENTS = {
 tomato: {name:'Tomato',color:'#cf5940',cook:6},
 mushroom: {name:'Mushroom',color:'#ac8960',cook:8},
 shrimp: {name:'Shrimp',color:'#ee9872',cook:7}
};
export const RECIPES = [
 {id:'sunshine',name:'Sunshine bowl',items:['tomato'],price:18,description:'Sweet blistered tomato on saffron rice',short:'Tomato + saffron rice'},
 {id:'woodland',name:'Woodland bowl',items:['mushroom'],price:22,description:'Golden mushrooms on saffron rice',short:'Mushroom + saffron rice'},
 {id:'harbor',name:'Harbor bowl',items:['shrimp'],price:26,description:'Seared shrimp on saffron rice',short:'Shrimp + saffron rice'},
 {id:'garden',name:'Garden duet',items:['mushroom','tomato'],price:38,description:'Tomato and mushroom, together at last',short:'Tomato + mushroom + rice'},
 {id:'coastal',name:'Coastal duet',items:['shrimp','tomato'],price:42,description:'Seared shrimp & blistered tomato on saffron rice',short:'Shrimp + tomato + rice'}
];
export const SHIFTS = [
 {name:'The lunch service',seconds:180,patience:100,goal:140,recipes:[0,1,3,2,4]},
 {name:'The golden hour',seconds:180,patience:85,goal:210,recipes:[2,3,1,4,0]},
 {name:'The supper rush',seconds:180,patience:72,goal:280,recipes:[3,2,4,3,1,0]}
];
export const STATIONS = [
 {id:'prep',x:265,y:212,chefX:265,chefY:290,key:'4',label:'Chopping board'},
 {id:'pan0',x:475,y:212,chefX:475,chefY:290,key:'5',label:'Pan one'},
 {id:'pan1',x:625,y:212,chefX:625,chefY:290,key:'6',label:'Pan two'},
 {id:'plate0',x:840,y:212,chefX:840,chefY:290,key:'7',label:'Plate one'},
 {id:'plate1',x:1020,y:212,chefX:1020,chefY:290,key:'8',label:'Plate two'},
 {id:'tomato',x:320,y:411,chefX:320,chefY:300,key:'1',label:'Tomato'},
 {id:'mushroom',x:470,y:411,chefX:470,chefY:300,key:'2',label:'Mushroom'},
 {id:'shrimp',x:620,y:411,chefX:620,chefY:300,key:'3',label:'Shrimp'},
 {id:'herbs',x:770,y:411,chefX:770,chefY:300,key:'9',label:'Finish with herbs'},
 {id:'serve',x:1000,y:411,chefX:1000,chefY:300,key:'Enter',label:'Serve selected plate'}
];
export function matchingRecipe(items){return RECIPES.find(r=>[...r.items].sort().join(',')===[...items].sort().join(','));}

