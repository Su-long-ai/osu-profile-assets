(()=>{'use strict';
const key='nb036-profile-input-v1:owner';
const valid=x=>x==='homecoming'||/^proof:[0-9a-z]{3}$/.test(x||'');
function owner(){
  const x=localStorage.getItem(key)||'';
  if(!x)return null;
  if(valid(x))return x;
  localStorage.removeItem(key);return null;
}
function claim(x){
  if(!valid(x))return false;
  localStorage.setItem(key,x);return true;
}
function is(x){return owner()===x}
function release(x){
  if(is(x)){localStorage.removeItem(key);return true}
  return false;
}
window.NBProfileInput=Object.freeze({owner,claim,is,release,key});
})();
