var Set = require("collections/set");
var pathSet = new Set(null, function(a, b){
	return  a.substr(0, Math.min(a.length, b.length))==b.substr(0, Math.min(a.length, b.length));
}, function(path){
       return 0;
});
var arr = "hell";
var arr2 ="hello";
console.log(arr.substr(0, Math.min(arr.length, arr2.length))==arr2.substr(0, Math.min(arr.length, arr2.length)));
console.log(pathSet.add(arr));
console.log(pathSet.add(arr2));

