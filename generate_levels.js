// generate_levels.js
// Generates a markdown table of XP per level and cumulative XP for levels 1..50

function xpPerLevel(level){
  return Math.round(100 * Math.pow(level, 1.15));
}

let cum = 0;
console.log('Level | XP for Level | Cumulative XP');
console.log('---|---:|---:');
for(let level=1; level<=50; level++){
  const xp = xpPerLevel(level);
  console.log(`${level} | ${xp} | ${cum}`);
  cum += xp;
}
