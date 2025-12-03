const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const QRCode = require('qrcode');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Configurações básicas
app.use(express.static(__dirname));
app.use(express.static('public'));

// --- CONFIGURAÇÃO DAS 3 PROMOÇÕES ---
let campanhas = [
    // 1. COMBUSTÍVEL (Sorteio - Dourado)
    { 
        id: 0, 
        tipo: 'foto', 
        arquivo: "slide1.jpg", // Tenta achar a foto
        nome: "Combustível 50% OFF", 
        qtd: 5, 
        ativa: true, 
        corPrincipal: '#FFD700', // Dourado
        corSecundaria: '#003399', // Azul
        prefixo: 'GOLD',
        ehSorteio: true, // Ativa modo sorteio
        totalResgates: 0 
    },
    // 2. DUCHA GRÁTIS (Azul)
    { 
        id: 1, 
        tipo: 'foto', 
        arquivo: "slide2.jpg", 
        nome: "Ducha Grátis",   
        qtd: 50, 
        ativa: true, 
        corPrincipal: '#0055aa', // Azul Escuro
        corSecundaria: '#0099ff', // Azul Claro
        prefixo: 'DUCHA',
        ehSorteio: false,
        totalResgates: 0
    },
    // 3. CAFÉ + SALGADO (Laranja)
    { 
        id: 2, 
        tipo: 'foto', 
        arquivo: "slide3.jpg", 
        nome: "Café + Salgado",        
        qtd: 50, 
        ativa: true, 
        corPrincipal: '#F37021', // Laranja
        corSecundaria: '#663300', // Marrom
        prefixo: 'CAFE',
        ehSorteio: false,
        totalResgates: 0
    }
];

let slideAtual = 0;

// Roda os slides a cada 15 segundos
setInterval(() => {
    slideAtual++;
    if (slideAtual >= campanhas.length) slideAtual = 0;
    io.emit('trocar_slide', campanhas[slideAtual]);
}, 15000);

function gerarCodigo(prefixo) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = '';
    for (let i=0; i<4; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
    return `${prefixo}-${res}`;
}

// --- TELA DA TV (COM PROTEÇÃO CONTRA TELA PRETA) ---
const htmlTV = `
<!DOCTYPE html>
<html>
<head><title>TV AMPM</title></head>
<body style="margin:0; background:black; overflow:hidden; font-family:Arial; transition: background 0.5s;">
    <div style="display:flex; height:100vh;">
        
        <div style="flex:3; background:#333; display:flex; align-items:center; justify-content:center; overflow:hidden; position:relative;" id="bgEsq">
            
            <img id="imgDisplay" src="" style="width:100%; height:100%; object-fit:contain; z-index:2; position:relative;" 
                 onerror="this.style.display='none'; document.getElementById('textoFalha').style.display='block'">
            
            <div id="textoFalha" style="display:none; text-align:center; color:white; z-index:1;">
                <h1 id="tituloFalha" style="font-size:4rem; text-transform:uppercase;">OFERTA</h1>
                <p>Aproveite agora!</p>
            </div>
            
        </div>

        <div style="flex:1; background:#003399; display:flex; flex-direction:column; align-items:center; justify-content:center; border-left:6px solid #FFCC00; text-align:center; color:white;" id="bgDir">
            <h1 id="nomeProd" style="font-size:2.5rem; padding:0 10px; font-weight:800;">...</h1>
            
            <div style="background:white; padding:10px; border-radius:10px; margin-top:20px;">
                <img id="qr" src="" style="width:200px; display:block;">
            </div>
            
            <p style="margin-top:10px; font-weight:bold; font-size:1.5rem; color:#FFCC00;" id="txtScan">ESCANEIE</p>
            
            <div id="boxNum" style="margin-top:30px; border-top:2px dashed rgba(255,255,255,0.3); width:80%; padding-top:20px;">
                <span style="font-size:1.2rem;">RESTAM:</span><br>
                <span id="num" style="font-size:6rem; font-weight:900;">--</span>
            </div>
        </div>
    </div>
    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io();
        
        // Gera QR Code sozinho ao abrir
        fetch('/qrcode').then(r=>r.text()).then(u=> document.getElementById('qr').src = u);

        socket.on('trocar_slide', (d) => { update(d); });
        socket.on('atualizar_qtd', (d) => {
            if(document.getElementById('nomeProd').innerText === d.nome) {
                document.getElementById('num').innerText = d.qtd;
            }
        });

        function update(d) {
            // Atualiza textos
            document.getElementById('nomeProd').innerText = d.nome;
            document.getElementById('tituloFalha').innerText = d.nome; // Backup
            document.getElementById('num').innerText = d.qtd;
            
            // Atualiza cores
            document.getElementById('bgDir').style.background = d.corPrincipal;
            document.getElementById('bgEsq').style.background = d.corSecundaria;
            
            // Ajuste de cor do texto (para não sumir no amarelo)
            const corTexto = (d.corPrincipal === '#FFD700') ? '#003399' : 'white';
            document.getElementById('bgDir').style.color = corTexto;
            document.getElementById('num').style.color = (d.corPrincipal === '#FFD700') ? '#003399' : '#FFCC00';
            document.getElementById('txtScan').style.color = (d.corPrincipal === '#FFD700') ? '#003399' : '#FFCC00';

            // Tenta mostrar imagem
            const img = document.getElementById('imgDisplay');
            img.style.display = 'block';
            document.getElementById('textoFalha').style.display = 'none';
            img.src = d.arquivo;

            // Esconde estoque se for sorteio
            if(d.ehSorteio) {
                document.getElementById('boxNum').style.display = 'none';
                document.getElementById('txtScan').innerText = "TENTE A SORTE!";
            } else {
                document.getElementById('boxNum').style.display = 'block';
                document.getElementById('txtScan').innerText = "GARANTA O SEU";
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
    body { font-family: Arial, sans-serif; text-align:center; padding:20px; background:#f0f2f5; margin:0; transition: background 0.3s; }
    .btn-pegar { width:100%; padding:20px; color:white; border:none; border-radius:10px; font-size:20px; margin-top:20px; font-weight:bold; box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
    .ticket-paper { background: #fff; padding: 20px; margin-top: 20px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); border-top: 10px solid #F37021; border-radius: 10px; }
    .codigo-texto { font-size: 32px; font-weight: bold; letter-spacing: 2px; font-family: monospace; color:#333; border: 2px dashed #ccc; padding: 10px; margin: 10px 0; background: #f9f9f9; }
    .no-print { display: block; }
    @media print { .no-print { display:none; } body { background:white; } .ticket-paper { box-shadow:none; border:1px solid #ccc; } }
</style>
<body>
    <div id="telaPegar">
        <h3 style="color:#555;">OFERTA ATUAL:</h3>
        <h1 id="nomeM" style="color:#003399; font-size: 30px;">...</h1>
        <div style="background:white; padding:10px; border-radius:5px; display:inline-block; margin-bottom: 20px;">
            <span style="color:#666;">ESTOQUE: </span><strong id="qtdM">--</strong>
        </div><br>
        <button onclick="resgatar()" id="btnResgatar" class="btn-pegar">...</button>
    </div>

    <div id="telaVoucher" style="display:none;">
        <h2 class="no-print" style="color:#003399;">PARABÉNS! 🎉</h2>
        <div class="ticket-paper" id="ticketContainer">
            <p style="font-size:14px; color:#666;">VOUCHER OFICIAL</p>
            <h2 id="voucherNome" style="color:#333;">...</h2>
            <div class="codigo-texto" id="codGerado">...</div>
            <p style="font-size:12px; color:#555;">Gerado: <span id="dataHora"></span></p>
            <p style="font-size:12px; font-weight:bold; color:red;">Válido hoje.</p>
        </div>
        <button onclick="window.print()" class="btn-pegar no-print" style="background:#333; margin-top:20px;">🖨️ IMPRIMIR</button>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io();
        let ofertaAtual = null;
        
        // Trava de 1 por dia
        const hoje = new Date().toLocaleDateString('pt-BR');
        const salvo = localStorage.getItem('ampm_cupom_final');
        const dataSalva = localStorage.getItem('ampm_data_final');
        if (salvo && dataSalva === hoje) { mostrarVoucher(JSON.parse(salvo)); }

        socket.on('trocar_slide', (d) => {
            if (document.getElementById('telaVoucher').style.display === 'none') {
                ofertaAtual = d;
                document.getElementById('nomeM').innerText = d.nome;
                document.getElementById('qtdM').innerText = d.qtd;
                const btn = document.getElementById('btnResgatar');
                btn.style.background = d.corPrincipal;
                
                if(d.ehSorteio) {
                     btn.style.color = (d.corPrincipal === '#FFD700') ? '#003399' : 'white';
                     btn.innerText = "TENTAR A SORTE (5%)";
                } else {
                     btn.style.color = 'white';
                     btn.innerText = "GARANTIR AGORA";
                }
            }
        });

        socket.emit('pedir_atualizacao');

        function resgatar() { if(ofertaAtual) socket.emit('resgatar_oferta', ofertaAtual.id); }

        socket.on('sucesso', (dados) => {
            const agora = new Date();
            dados.horaTexto = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR');
            localStorage.setItem('ampm_cupom_final', JSON.stringify(dados));
            localStorage.setItem('ampm_data_final', agora.toLocaleDateString('pt-BR'));
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
            
            if(dados.isGold) {
                document.body.style.backgroundColor = "#FFD700";
                document.getElementById('voucherNome').innerHTML = "🌟 " + dados.produto + " 🌟";
            }
        }
    </script>
</body>
</html>
`;

// --- ADMIN ---
const htmlAdmin = `
<!DOCTYPE html><html><meta name="viewport" content="width=device-width, initial-scale=1"><body style="font-family:Arial; padding:20px; background:#222; color:white;">
<h1>🎛️ Admin AMPM</h1><div id="paineis"></div><script src="/socket.io/socket.io.js"></script><script>const socket=io();socket.on('dados_admin',(lista)=>{const div=document.getElementById('paineis');div.innerHTML="";lista.forEach((c,index)=>{div.innerHTML+=\`<div style="background:#444; padding:15px; margin-bottom:15px; border-radius:10px; border-left: 8px solid \${c.ativa?'#0f0':'#f00'}"><h3 style="margin-top:0;">\${c.nome}</h3><label>Estoque: </label><input id="qtd_\${index}" type="number" value="\${c.qtd}" style="width:60px;"> <button onclick="salvar(\${index})">Salvar</button><br><br><span>📈 Já Pegaram: <b>\${c.totalResgates}</b></span></div>\`});});function salvar(id){const q=document.getElementById('qtd_'+id).value;socket.emit('admin_update',{id:id,qtd:q});alert('Atualizado!');}</script></body></html>
`;

// --- ROTAS ---
app.get('/tv', (req, res) => res.send(htmlTV));
app.get('/admin', (req, res) => res.send(htmlAdmin));
app.get('/mobile', (req, res) => res.send(htmlMobile));
app.get('/', (req, res) => res.redirect('/tv'));
app.get('/qrcode', (req, res) => { 
    const url = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}/mobile`; 
    QRCode.toDataURL(url, (e, s) => res.send(s)); 
});

// --- LÓGICA ---
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
                    isGold = true; nomeFinal = "PARABÉNS! 50% OFF";
                } else {
                    cor1 = '#ccc'; cor2 = '#333'; nomeFinal = "Ganhou: 2% OFF"; prefixo = "DESC";
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
        io.emit('dados_admin', campanhas); 
        if(slideAtual === d.id) io.emit('trocar_slide', campanhas[d.id]); 
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Rodando na porta ${PORT}`));
