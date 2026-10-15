import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const port=Number(process.env.PORT||8080);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.wav':'audio/wav','.json':'application/json'};
const server=http.createServer(async(req,res)=>{
 try{
  let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(pathname==='/'){res.writeHead(302,{Location:'/star-abyss/'});res.end();return;}
  let file=path.resolve(root,'.'+pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  if((await stat(file)).isDirectory())file=path.join(file,'index.html');
  const body=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(body);
 }catch{res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');}
});
server.listen(port,'127.0.0.1',()=>console.log(`Star Abyss development server running on port ${port}`));
process.on('SIGTERM',()=>server.close(()=>process.exit(0)));
