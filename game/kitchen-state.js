import {INGREDIENTS, RECIPES, SHIFTS, matchingRecipe} from './recipes.js';
export function createKitchen(shift=0,practice=false){
 const state={shift,practice,remaining:SHIFTS[shift].seconds,elapsed:0,money:0,served:0,missed:0,wasted:0,combo:0,bestCombo:0,hand:null,prep:null,pans:[null,null],plates:[{items:[],herbs:false},{items:[],herbs:false}],selectedPlate:0,orders:[],nextId:1,orderIndex:0,paused:false,ended:false,chef:{x:365,y:285,tx:365,ty:285},particles:[],lastAction:'',notice:'',noticeTime:0};
 for(let i=0;i<3;i++) addOrder(state,i*12);
 return state;
}
export function addOrder(s,extra=0){
 const shift=SHIFTS[s.shift]; const recipe=RECIPES[shift.recipes[s.orderIndex++ % shift.recipes.length]];
 const max=shift.patience+extra+(recipe.items.length>1?25:0)-Math.min(20,Math.floor(s.elapsed/60)*6);
 s.orders.push({id:s.nextId++,recipe,remaining:max,max});
}
export function tell(s,text,tone='tap'){s.notice=text;s.noticeTime=3;s.lastSound=tone;}
export function tickKitchen(s,dt){
 if(s.paused||s.ended)return;
 s.elapsed+=dt;if(!s.practice)s.remaining=Math.max(0,s.remaining-dt);
 s.noticeTime=Math.max(0,s.noticeTime-dt);
 const c=s.chef;const dx=c.tx-c.x,dy=c.ty-c.y,d=Math.hypot(dx,dy); if(d>1){const a=Math.min(1,dt*480/d);c.x+=dx*a;c.y+=dy*a;}
 for(const pan of s.pans)if(pan){const was=pan.time;pan.time+=dt;const need=INGREDIENTS[pan.item].cook;if(was<need&&pan.time>=need)tell(s,`${INGREDIENTS[pan.item].name} is ready! Take it off the heat.`, 'ready');if(was<need+11&&pan.time>=need+11){pan.burnt=true;s.wasted++;s.combo=0;tell(s,'A pan burned. Click it with empty hands to clear it.','bad');}}
 if(!s.practice){for(const o of s.orders)o.remaining-=dt;const expired=s.orders.filter(o=>o.remaining<=0);if(expired.length){s.missed+=expired.length;s.combo=0;s.orders=s.orders.filter(o=>o.remaining>0);for(const o of expired)addOrder(s);tell(s,'A guest had to leave. Take a breath; the next bowl is yours.','bad');}}
 s.particles=s.particles.filter(p=>(p.life-=dt)>0);
 if(!s.practice&&s.remaining<=0)s.ended=true;
}
export function act(s,id){
 if(s.paused||s.ended)return;
 s.lastAction=id;
 if(INGREDIENTS[id]){
 if(s.hand)return tell(s,'Your hands are full. Put that ingredient down first.');
 s.hand={item:id,stage:'raw'};tell(s,`${INGREDIENTS[id].name} picked. Bring it to the chopping board.`);return;
 }
 if(id==='prep'){
 if(s.hand){if(s.hand.stage!=='raw')return tell(s,'Prepared food goes into a pan, cooked food onto a plate.');if(s.prep)return tell(s,'Finish the ingredient already on the board.');s.prep={item:s.hand.item,chops:0};s.hand=null;tell(s,'On the board. Tap three times to chop.');return;}
 if(!s.prep)return tell(s,'Pick an ingredient from the pantry first.');
 s.prep.chops++;s.lastSound='chop';s.particles.push({x:265,y:148,life:.5,color:INGREDIENTS[s.prep.item].color});
 if(s.prep.chops>=3){s.hand={item:s.prep.item,stage:'chopped'};s.prep=null;tell(s,'Beautifully chopped. Choose an empty pan.','chop');}else tell(s,`${s.prep.chops}/3 chops · keep tapping`, 'chop');return;
 }
 if(id.startsWith('pan')){
 const i=Number(id.slice(-1)),pan=s.pans[i];
 if(pan){if(s.hand)return tell(s,'Empty your hands before taking food off the stove.');if(pan.burnt){s.pans[i]=null;return tell(s,'Pan cleaned. A fresh start.');}if(pan.time<INGREDIENTS[pan.item].cook)return tell(s,'Let it sizzle a little longer. Prep something else!');s.hand={item:pan.item,stage:'cooked'};s.pans[i]=null;return tell(s,'Perfectly cooked. Add it to either rice bowl.','ready');}
 if(!s.hand||s.hand.stage!=='chopped')return tell(s,'Chop an ingredient before adding it to the pan.');
 s.pans[i]={item:s.hand.item,time:0,burnt:false};s.hand=null;tell(s,'Hear that sizzle? Prep the next ingredient while it cooks.','sizzle');return;
 }
 if(id.startsWith('plate')){
 const i=Number(id.slice(-1));s.selectedPlate=i;const plate=s.plates[i];
 if(!s.hand)return tell(s,plate.items.length?'Plate selected. Add herbs, then serve a matching order.':'Plate selected. Saffron rice is ready for a cooked topping.');
 if(s.hand.stage!=='cooked')return tell(s,'Cook the ingredient before plating it.');
 if(plate.items.includes(s.hand.item)||plate.items.length>=2)return tell(s,'This bowl already has that topping, or is full. Try the other plate.');
 plate.items.push(s.hand.item);s.hand=null;plate.herbs=false;tell(s,'Plated! Add herbs for a bonus, or add another topping for a duet.','ready');return;
 }
 if(id==='herbs'){
 if(s.hand)return tell(s,'Put down your ingredient before finishing a bowl.');
 const p=s.plates[s.selectedPlate];if(!p.items.length)return tell(s,'Select a plate with cooked food first.');
 if(p.herbs)return tell(s,'Already finished with fresh herbs. Ready for a guest.');p.herbs=true;tell(s,'A little green, a little love. Herb finish: +5 coins.','ready');return;
 }
 if(id==='serve')return servePlate(s);
 if(id==='discard'){
 if(s.hand){s.hand=null;s.wasted++;s.combo=0;return tell(s,'Ingredient composted.');}
 const p=s.plates[s.selectedPlate];if(p.items.length){p.items=[];p.herbs=false;s.wasted++;s.combo=0;return tell(s,'Selected bowl cleared.');}
 if(s.prep){s.prep=null;s.wasted++;return tell(s,'Chopping board cleared.');}return tell(s,'Nothing to discard.');
 }
}
export function servePlate(s,orderId){
 if(s.hand)return tell(s,'Set down the ingredient in your hands before serving.');
 const plate=s.plates[s.selectedPlate],recipe=matchingRecipe(plate.items);
 const order=s.orders.find(o=>(!orderId||o.id===orderId)&&o.recipe.id===recipe?.id);
 if(!order)return tell(s,plate.items.length?'No matching order for this plate. Check the recipe book.':'Add cooked toppings to a plate before serving.','bad');
 const fresh=order.remaining/order.max>.5; s.combo++;s.bestCombo=Math.max(s.bestCombo,s.combo);
 const bonus=(plate.herbs?5:0)+(fresh?3:0)+Math.min(15,(s.combo-1)*2),earned=recipe.price+bonus;
 s.money+=earned;s.served++;s.orders=s.orders.filter(o=>o!==order);addOrder(s);plate.items=[];plate.herbs=false;
 s.particles.push({x:1000,y:335,life:1.2,color:'#e4b946'});tell(s,`Served with love! +${earned} coins${s.combo>1?' · '+s.combo+' bowl streak':''}`, 'serve');
}
export function nextHint(s){
 if(s.hand?.stage==='raw')return 'Bring your ingredient to the board [4], then tap three times.';
 if(s.hand?.stage==='chopped')return 'Into an empty pan [5 / 6]. You can prep another ingredient while it cooks.';
 if(s.hand?.stage==='cooked')return 'Add your cooked topping to plate one [7] or plate two [8].';
 if(s.pans.some(p=>p?.burnt))return 'Burnt pan? Click it with empty hands to clean it.';
 if(s.pans.some(p=>p&&p.time>=INGREDIENTS[p.item].cook))return 'A pan is ready! Click it before the food burns.';
 if(s.prep)return 'Tap the chopping board [4] to finish preparing your ingredient.';
 const p=s.plates[s.selectedPlate];if(p.items.length)return p.herbs?'Press Enter to serve this bowl, or click its matching order.':'Finish with herbs [9] for +5 coins, then Enter to serve.';
 return 'Check the orders. Choose tomato [1], mushroom [2], or shrimp [3].';
}
