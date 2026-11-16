(()=>{'use strict';
const ids=['keys','dates','mirror','margin'];
const joined=localStorage.getItem('nb036-misc-v4:joined')==='1';
const complete=ids.every(id=>localStorage.getItem('nb036-impression-v3:contact:'+id)==='1');
if(!joined||!complete){location.replace(joined?'./impression.html':'./');return}
document.querySelector('.verso-stage').hidden=false;
})();