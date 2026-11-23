const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(process.env.ODEN_ROOT || path.join(__dirname, '..'));
const work = __dirname;
const captures = path.resolve(process.env.ODEN_CAPTURES || 'artifacts/oden-montage');
fs.mkdirSync(captures, {recursive:true});
const mime = {'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg','.glb':'model/gltf-binary'};
const battle = {'arena.mjs':'game','clown-battle.mjs':'g','dice-battle.mjs':'g','blood-battle.mjs':'g'};
const server = http.createServer(async (req,res) => {
  const {pathname} = new URL(req.url,'http://localhost');
  try {
    const name = decodeURIComponent(pathname);
    const file = name === '/shoot.mjs' ? path.join(work,'shoot.mjs') :
      name.startsWith('/vendor/') ? path.join(root,'node_modules','three','build',path.basename(name)) : path.resolve(root,'.'+name);
    if (!file.startsWith(root+path.sep) && file !== path.join(work,'shoot.mjs')) throw new Error('Invalid path');
    const extension = path.extname(file);
    res.setHeader('Content-Type',mime[extension]||'application/octet-stream');
    res.setHeader('Cache-Control','no-store');
    if (name === '/spider-combat.html') {
      const html = fs.readFileSync(file,'utf8')
        .replace('https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js','/vendor/three.module.min.js')
        .replace(/<link[^>]+https:\/\/fonts[^>]+>\s*/g,'')
        .replace(/<script type="module">[\s\S]*?<\/script>/,'<script type="module" src="/shoot.mjs"></script>');
      res.end(html);
    } else if (name === '/src/runtime/battle-loop.mjs') {
      const source=fs.readFileSync(file,'utf8').replace('    update(timestamp,dt,elapsed);','    if (!window.__shoot?.manual) update(timestamp,dt,elapsed);').replace('  return {','  window.__shoot?.loops.push(update);\n  return {');
      res.end(source);
    } else if (name === '/src/dice-giant.mjs') {
      res.end(fs.readFileSync(file,'utf8').replace('slot=nextGiantPressureSlot(g)', 'slot=q.captureSlot??nextGiantPressureSlot(g)'));
    } else if (battle[path.basename(file)] && name.startsWith('/src/')) {
      const game = battle[path.basename(file)];
      const hook='if(!window.__shoot?.skipRender)renderer.render(scene,camera);window.__shoot?.render(renderer,scene,camera,'+game+',!introGate.blocked);';
      const source=fs.readFileSync(file,'utf8').replace(/renderer\.render\(scene,camera\);(?=audit|quality)/,hook)
        .replace('function readInput(){','function readInput(){if(window.__shoot?.manual)return window.__shoot.movement;')
        .replace('return cameraMovement(keys,stick,yaw,lock);','return window.__shoot?.manual?window.__shoot.movement:cameraMovement(keys,stick,yaw,lock);')
        .replace('const input=()=>cameraMovement(keys,stick,yaw,lock)','const input=()=>window.__shoot?.manual?window.__shoot.movement:cameraMovement(keys,stick,yaw,lock)');
      res.end(source);
    } else {
      res.end(fs.readFileSync(file));
    }
  } catch (error) { res.writeHead(404);res.end('missing'); }
});
module.exports = {server, root, captures};
