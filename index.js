const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const QRCode = require('qrcode');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(__dirname));
app.use(express.static('public'));

// --- CONFIGURAÇÃO DAS 3 PROMOÇÕES FIXAS ---
let campanhas = [
    // SLIDE 0: COMBUSTÍVEL (OURO - SORTEIO DIFÍCIL)
    { 
        id: 0, 
        tipo: 'foto', 
        arquivo: "slide1.jpg", 
        nome: "Sorteio 50% OFF", 
        qtd: 5, 
        totalResgates: 0,
        ativa: true, 
        corPrincipal: '#FFD700', // Dourado
        corSecundaria: '#003399', // Azul
        prefixo: 'GOLD',
        ehSorteio: true 
    },
    // SLIDE 1: DUCHA GRÁTIS (AZUL)
    { 
        id: 1, 
        tipo: 'foto', 
        arquivo: "slide2.jpg", 
        nome: "Ducha Grátis",   
        qtd: 50, 
        totalResgates: 0,
        ativa: true, 
        corPrincipal: '#0055aa', 
        corSecundaria: '#0099ff', 
        prefixo: 'DUCHA',
        ehSorteio: false
    },
    // SLIDE 2: CAFÉ EXPRESSO (LARANJA)
    { 
        id: 2, 
        tipo: 'foto', 
        arquivo: "slide3.jpg", 
        nome: "Café Expresso Grátis",        
        qtd: 50, 
        totalResgates: 0,
        ativa: true, 
        corPrincipal: '#F37021', 
        corSecundaria: '#663300', 
        prefixo: 'CAFE',
        ehSorteio: false
    }
];

let slideAtual = 0;

// --- ROTAÇÃO AUTOMÁTICA (15 SEGUNDOS) ---
setInterval(() => {
    slideAtual++;
    if (slideAtual >= campanhas.length) slideAtual = 0;
    io.emit('trocar_slide', campanhas[slideAtual]);
}, 15000);

function gerarCodigo(prefixo) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 4; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return `${prefixo}-${result}`;
}

// --- HTML DA TV ---
const htmlTV = `
<!DOCTYPE html>
<html>
<head><title>TV AMPM</title></head>
<body style="margin:0; background:black; overflow:hidden; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; transition: background 0.5s;">
    <div style="display:flex; height:100vh;">
        <div style="flex:3; background:#ccc; display:flex; align-items:center; justify-content:center; overflow:hidden;" id="bgEsq">
            <img id="imgDisplay" src="" style="width:100%; height:100%; object-fit:contain; display:none;">
            <video id="vidDisplay" src="" style="width:100%; height:100%; object-fit:contain; display:none;" muted playsinline></video>
        </div>
        <div style="flex:1; background:#003399; display:flex; flex-direction:column; align-items:center; justify-content:center; border-left:6px solid #FFCC00; text-align:center; color:white;" id="bgDir">
            <img src="logo.png" onerror="this.style.display='none'" style="width:160px; background:white; padding:15px; border-radius:15px; margin-bottom:30px; box-shadow: 0 5px 15px rgba(0,0,0,0.3);">
            <h1 id="nomeProd" style="font-size:2.2rem; padding:0 10px; line-height:1.1; text-transform:uppercase; font-weight:800; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">...</h1>
            <div style="background:white; padding:10px; border-radius:10px; margin-top:20px;">
                <img id="qr" src="qrcode.png" style="width:200px; display:block;" onerror="this.onerror=null; fetch('/qrcode').then(r=>r.text()).then(u=>this.src=u);">
            </div>
            <p style="margin-top:10px; font-weight:bold; font-size:1.2rem; color:#FFCC00;" id="txtScan">ESCANEIE PARA GANHAR</p>
            <div id="boxNum" style="margin-top:30px; border-top:2px dashed rgba(255,255,255,0.3); width:80%; padding-top:20px;">
                <span style="font-size:1.2rem;">RESTAM APENAS:</span><br>
                <span id="num" style="font-size:6rem; font-weight:900; line-height:1;">--</span>
            </div>
        </div>
    </div>
    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io();
        const imgTag = document.getElementById('imgDisplay');
        const vidTag = document.getElementById('vidDisplay');
        socket.on('trocar_slide', (d) => { actualizarTela(d); });
        socket.on('atualizar_qtd', (d) => {
            if(document.getElementById('nomeProd').innerText === d.nome) {
                document.getElementById('num').innerText = d.qtd;
            }
        });
        function actualizarTela(d) {
            document.getElementById('nomeProd').innerText = d.nome;
            document.getElementById('num').innerText = d.qtd;
            document.getElementById('bgDir').style.background = d.corPrincipal;
            document.getElementById('bgEsq').style.background = d.corSecundaria;
            const corTexto = (d.corPrincipal === '#FFD700') ? '#003399' : 'white';
            document.getElementById('bgDir').style.color = corTexto;
            document.getElementById('num').style.color = (d.corPrincipal === '#FFD700') ? '#003399' : '#FFCC00';

            if(d.ehSorteio) {
                document.getElementById('boxNum').style.display = 'none';
                document.getElementById('txtScan').innerText = "TENTE A SORTE!";
            } else {
                document.getElementById('boxNum').style.display = 'block';
                document.getElementById('txtScan').innerText = "GARANTA O SEU";
            }

            if (d.tipo === 'video') {
                imgTag.style.display = 'none'; vidTag.style.display = 'block'; vidTag.src = d.arquivo; vidTag.play().catch(e => console.log(e));
            } else {
                vidTag.pause(); vidTag.style.display = 'none'; imgTag.style.display = 'block'; imgTag.src = d.arquivo;
            }
        }
    </script>
</body>
</html>
`;

// --- HTML MOBILE ---
const htmlMobile = `
<!DOCTYPE html>
<html>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align:center; padding:20px; background:#f0f2f5; margin:0; transition: background 0.3s; }
    .btn-pegar { width:100%; padding:20px; color:white; border:none; border-radius:10px; font-size:20px; margin-top:20px; font-weight:bold; text-transform:uppercase; box-shadow: 0 4px 10px rgba(0,0,0,0.2); transition: transform 0.2s; }
    .btn-pegar:active { transform: scale(0.98); }
    .img-prod { width:100%; max-width:300px; border-radius:10px; margin-bottom:15px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .ticket-paper { background: #fff; padding: 0; margin-top: 20px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); position: relative; overflow: hidden; border-top: 10px solid #F37021; }
    .ticket-body { padding: 25px; text-align: center; }
    .ticket-header { font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 5px; }
    .ticket-offer { font-size: 24px; font-weight: 900; color: #333; margin: 5px 0; line-height:1.2; }
    .codigo-box { background: #f8f9fa; border: 2px dashed #ccc; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .codigo-texto { font-size: 32px; font-weight: bold; letter-spacing: 2px; margin:0; font-family: 'Courier New', monospace; }
    .serrilhado { height: 10px; width: 100%; background-image: radial-gradient(circle, #f0f2f5 50%, transparent 50%); background-size: 20px 20px; background-position: bottom; margin-top: -10px; }
    .no-print { display: block; }
    @media print { .no-print { display:none; } body { background:white; padding:0; } .ticket-paper { box-shadow:none; border:1px solid #ccc; } }
</style>
<body>
    <div id="telaPegar">
        <h3 style="color:#555; text-transform:uppercase; font-size:14px; letter-spacing:1px;">Oferta Disponível:</h3>
        <img id="fotoM" src="" class="midia-prod" style="display:none;">
        <video id="vidM" src="" class="midia-prod" style="display:none;" muted playsinline autoplay loop></video>
        <h2 id="nomeM" style="color:#003399; margin:10px 0; font-weight:800;">...</h2>
        <div style="background:white; padding:15px; border-radius:8px; display:inline-block; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
            <span style="color:#666; font-size:12px;">ESTOQUE</span><br><strong id="qtdM" style="font-size:24px; color:#333;">--</strong>
        </div>
        <button onclick="resgatar()" id="btnResgatar" class="btn-pegar">RESGATAR CUPOM</button>
    </div>
    <div id="telaVoucher" style="display:none;">
        <h2 class="no-print" style="color:#003399;">SUCESSO! 🎉</h2>
        <div class="ticket-paper" id="ticketContainer">
            <div class="ticket-body">
                <img src="logo.png" width="100" style="margin-bottom:15px;" onerror="this.style.display='none'">
                <p class="ticket-header">Voucher Promocional</p>
                <h1 id="voucherNome" class="ticket-offer">...</h1>
                <div class="codigo-box" id="codBox">
                    <p style="font-size:10px; margin:0; color:#999; text-transform:uppercase;">Código de Autorização</p>
                    <div class="codigo-texto" id="codGerado">...</div>
                </div>
                <p style="font-size:12px; color:#555;">Emitido em: <span id="dataHora" style="font-weight:bold;"></span><br><span style="color:#F37021; font-weight:bold;">Válido apenas hoje nesta unidade.</span></p>
            </div>
            <div class="serrilhado"></div>
        </div>
        <button onclick="window.print()" class="btn-pegar no-print" style="background:#333; margin-top:30px;">🖨️ IMPRIMIR / SALVAR</button>
    </div>
    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io();
        let ofertaAtual = null;
        
        // --- TRAVA DE SEGURANÇA (1 POR DIA) ---
        const hoje = new Date().toLocaleDateString('pt-BR');
        const salvo = localStorage.getItem('ampm_cupom');
        const dataSalva = localStorage.getItem('ampm_data');
        if (salvo && dataSalva === hoje) { mostrarVoucher(JSON.parse(salvo)); }

        socket.on('trocar_slide', (d) => {
            if (document.getElementById('telaVoucher').style.display === 'none') {
                ofertaAtual = d;
                const imgTag = document.getElementById('fotoM'); const vidTag = document.getElementById('vidM');
                if (d.tipo === 'video') { imgTag.style.display = 'none'; vidTag.style.display = 'block'; vidTag.src = d.arquivo; } 
                else { vidTag.style.display = 'none'; imgTag.style.display = 'block'; imgTag.src = d.arquivo; }
                document.getElementById('nomeM').innerText = d.nome;
                document.getElementById('qtdM').innerText = d.qtd;
                document.getElementById('btnResgatar').style.background = d.corPrincipal;
                if(d.ehSorteio) {
                     document.getElementById('btnResgatar').style.color = '#003399';
                     document.getElementById('btnResgatar').innerText = "TENTAR A SORTE (5%)";
                } else {
                     document.getElementById('btnResgatar').style.color = 'white';
                     document.getElementById('btnResgatar').innerText = "GARANTIR AGORA";
                }
            }
        });
        socket.emit('pedir_atualizacao');
        function resgatar() { if(ofertaAtual) socket.emit('resgatar_oferta', ofertaAtual.id); }
        socket.on('sucesso', (dados) => {
            const agora = new Date();
            dados.horaTexto = agora.toLocaleDateString('pt-BR') + ' às ' + agora.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
            localStorage.setItem('ampm_cupom', JSON.stringify(dados));
            localStorage.setItem('ampm_data', agora.toLocaleDateString('pt-BR'));
            mostrarVoucher(dados);
        });
        function mostrarVoucher(dados) {
            document.getElementById('telaPegar').style.display='none';
            document.getElementById('telaVoucher').style.display='block';
            document.getElementById('voucherNome').innerText = dados.produto;
            document.getElementById('codGerado').innerText = dados.codigo;
            document.getElementById('dataHora').innerText = dados.horaTexto;
            document.getElementById('ticketContainer').style.borderTopColor = dados.corPrincipal;
            document.getElementById('codGerado').style.color = dados.corPrincipal;
            document.getElementById('codBox').style.borderColor = dados.corPrincipal;
        }
    </script>
</body>
</html>
`;

// --- ADMIN ---
const htmlAdmin = `
<!DOCTYPE html><html><meta name="viewport" content="width=device-width, initial-scale=1"><body style="font-family:Arial; padding:20px; background:#222; color:white;">
<h1>🎛️ Controle AMPM</h1><div id="paineis"></div><script src="/socket.io/socket.io.js"></script><script>const socket=io();socket.on('dados_admin',(lista)=>{const div=document.getElementById('paineis');div.innerHTML="";lista.forEach((c,index)=>{div.innerHTML+=\`<div style="background:#444; padding:15px; margin-bottom:15px; border-radius:10px; border-left: 8px solid \${c.ativa?'#0f0':'#f00'}"><h3 style="margin-top:0; color:white;">\${c.nome}</h3><div style="display:flex; gap:20px; align-items:center; background:#333; padding:10px; border-radius:5px;"><div><label>Estoque:</label><br><input id="qtd_\${index}" type="number" value="\${c.qtd}" style="width:60px; font-weight:bold;"></div><div style="border-left:1px solid #666; padding-left:20px;"><label style="color:#00ff00;">📈 JÁ PEGARAM:</label><br><span style="font-size:24px; font-weight:bold;">\${c.totalResgates}</span></div></div><div style="margin-top:10px;"><button onclick="salvar(\${index})" style="padding:8px 15px; background:#F37021; color:white; border:none; border-radius:5px; cursor:pointer;">💾 ATUALIZAR</button></div></div>\`});});function salvar(id){const q=document.getElementById('qtd_'+id).value;socket.emit('admin_update',{id:id,qtd:q});alert('Atualizado!');}</script></body></html>
`;

// --- ROTAS ---
app.get('/tv', (req, res) => res.send(htmlTV));
app.get('/admin', (req, res) => res.send(htmlAdmin));
app.get('/mobile', (req, res) => res.send(htmlMobile));
app.get('/', (req, res) => res.redirect('/tv'));
app.get('/qrcode', (req, res) => { const url = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}/mobile`; QRCode.toDataURL(url, (e, s) => res.send(s)); });

// --- LÓGICA DO SERVIDOR ---
io.on('connection', (socket) => {
    socket.emit('trocar_slide', campanhas[slideAtual]);
    socket.emit('dados_admin', campanhas);
    socket.on('pedir_atualizacao', () => { socket.emit('trocar_slide', campanhas[slideAtual]); });
    
    socket.on('resgatar_oferta', (id) => {
        let camp = campanhas[id];
        if (camp && camp.qtd > 0) {
            camp.qtd--;
            camp.totalResgates++;
            io.emit('atualizar_qtd', camp);
            if(slideAtual === id) io.emit('trocar_slide', camp);
            
            let cor1 = camp.corPrincipal; let cor2 = camp.corSecundaria; let nomeFinal = camp.nome; let isGold = false; let prefixo = camp.prefixo;

            if (camp.ehSorteio) {
                const sorte = Math.floor(Math.random() * 100) + 1;
                if (sorte > 95) { 
                    isGold = true;
                    nomeFinal = "PARABÉNS! 50% DE DESCONTO";
                } else {
                    cor1 = '#cccccc'; cor2 = '#333333';
                    nomeFinal = "Ganhou: 2% OFF (Consolação)";
                    prefixo = "DESC";
                }
            }

            socket.emit('sucesso', { 
                codigo: gerarCodigo(prefixo), 
                produto: nomeFinal,
                corPrincipal: cor1,
                corSecundaria: cor2,
                isGold: isGold
            });
            io.emit('dados_admin', campanhas);
        }
    });

    socket.on('admin_update', (d) => { 
        campanhas[d.id].qtd = parseInt(d.qtd);
        campanhas[d.id].ativa = d.ativa;
        io.emit('dados_admin', campanhas); 
        if(slideAtual === d.id) io.emit('trocar_slide', campanhas[d.id]); 
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`AMPM rodando na porta ${PORT}`));
