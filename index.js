const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const QRCode = require('qrcode');

// IMPORTAÇÕES
const campanhas = require('./config'); 
const { htmlTV, htmlMobile, htmlAdmin, htmlCaixa } = require('./templates'); 

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(__dirname));
app.use(express.static('public'));

let historicoVendas = []; 
let slideAtual = 0;

campanhas.forEach(c => {
    if(!c.totalResgates) c.totalResgates = 0;
    if(!c.resgatesPorHora) c.resgatesPorHora = new Array(24).fill(0);
    if(!c.ultimoCupom) c.ultimoCupom = "Nenhum";
});

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

function atualizarAdmin() {
    const ultimos = historicoVendas.slice().reverse().slice(0, 20);
    io.emit('dados_admin', { campanhas, ultimos });
}

app.get('/baixar-relatorio', (req, res) => {
    let csv = "\uFEFFDATA;HORA EMISSÃO;HORA USO;PRODUTO;CODIGO;STATUS\n";
    historicoVendas.forEach(h => {
        const horaBaixa = h.horaBaixa ? h.horaBaixa : "-";
        csv += `${h.data};${h.hora};${horaBaixa};${h.produto};${h.codigo};${h.status}\n`;
    });
    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.attachment('relatorio_ampm_completo.csv');
    res.send(csv);
});

// ROTAS
app.get('/tv', (req, res) => res.send(htmlTV));
app.get('/mobile', (req, res) => res.send(htmlMobile));
app.get('/admin', (req, res) => res.send(htmlAdmin));
app.get('/caixa', (req, res) => res.send(htmlCaixa));
app.get('/', (req, res) => res.redirect('/tv'));

app.get('/qrcode', (req, res) => { 
    const url = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}/mobile`; 
    res.type('png');
    QRCode.toFileStream(res, url); 
});

io.on('connection', (socket) => {
    socket.emit('trocar_slide', campanhas[slideAtual]);
    atualizarAdmin(); 
    
    socket.on('validar_cupom', (codDigitado) => {
        const codigoLimpo = codDigitado.trim().toUpperCase();
        const cupom = historicoVendas.find(v => v.codigo === codigoLimpo);

        if (!cupom) {
            socket.emit('resultado_validacao', { sucesso: false, msg: "❌ CÓDIGO NÃO ENCONTRADO!" });
        } else if (cupom.status === 'USADO') {
            socket.emit('resultado_validacao', { sucesso: false, msg: `⚠️ ERRO: JÁ FOI USADO!\nValidado às: ${cupom.horaBaixa}` });
        } else {
            cupom.status = 'USADO';
            const agora = new Date();
            agora.setHours(agora.getHours() - 3);
            cupom.horaBaixa = agora.toLocaleTimeString('pt-BR');
            socket.emit('resultado_validacao', { sucesso: true, msg: `✅ VÁLIDO!\nProduto: ${cupom.produto}` });
            atualizarAdmin(); 
        }
    });

    socket.on('pedir_atualizacao', () => { socket.emit('trocar_slide', campanhas[slideAtual]); });
    
    socket.on('resgatar_oferta', (id) => {
        let camp = campanhas[id];
        if (camp && camp.qtd > 0) {
            camp.qtd--;
            camp.totalResgates++;
            const agora = new Date();
            agora.setHours(agora.getHours() - 3);
            const horaAtual = agora.getHours();
            if(horaAtual >= 0 && horaAtual <= 23) camp.resgatesPorHora[horaAtual]++;
            
            let cod = gerarCodigo(camp.prefixo);
            let horaStr = agora.toLocaleTimeString('pt-BR');
            let isGold = false; 
            let tipoPremio = "Normal";
            let nomeFinal = camp.nome;
            let cor1 = camp.corPrincipal;

            if (camp.ehSorteio) {
                const sorte = Math.floor(Math.random() * 100) + 1;
                if (sorte > 95) { 
                    isGold = true; nomeFinal = "PARABÉNS! 50% OFF"; tipoPremio="OURO";
                } else { 
                    cor1 = '#cccccc'; nomeFinal = "Ganhou: 2% OFF"; tipoPremio="BRONZE";
                }
            }

            historicoVendas.push({
                data: agora.toLocaleDateString('pt-BR'),
                hora: horaStr,
                horaBaixa: null,
                produto: nomeFinal,
                codigo: cod,
                tipo: tipoPremio,
                status: 'PENDENTE'
            });

            io.emit('atualizar_qtd', camp);
            if(slideAtual === id) io.emit('trocar_slide', camp);
            socket.emit('sucesso', { codigo: cod, produto: nomeFinal, corPrincipal: cor1, isGold: isGold });
            atualizarAdmin(); 
        }
    });
    socket.on('admin_update', (d) => { campanhas[d.id].qtd = parseInt(d.qtd); atualizarAdmin(); if(slideAtual === d.id) io.emit('trocar_slide', campanhas[d.id]); });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`AMPM rodando na porta ${PORT}`));
