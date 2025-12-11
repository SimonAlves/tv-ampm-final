// --- CONFIGURAÇÃO DAS CAMPANHAS ---
// Edite aqui para mudar imagens, nomes e cores.

module.exports = [
    // SLIDE 0: COMBUSTÍVEL
    { 
        id: 0, 
        tipo: 'foto', 
        arquivo: "slide1.jpg", // Nome exato do arquivo no seu GitHub
        nome: "Sorteio 50% OFF", 
        qtd: 5, 
        ativa: true, 
        corPrincipal: '#FFD700', // Dourado
        corSecundaria: '#003399', // Azul
        prefixo: 'GOLD',
        ehSorteio: true // Ativa a roleta
    },
    // SLIDE 1: DUCHA
    { 
        id: 1, 
        tipo: 'foto', 
        arquivo: "slide2.jpg", // Nome exato do arquivo no seu GitHub
        nome: "Ducha Grátis",   
        qtd: 50, 
        ativa: true, 
        corPrincipal: '#0055aa', // Azul Escuro
        corSecundaria: '#0099ff', 
        prefixo: 'DUCHA',
        ehSorteio: false
    },
    // SLIDE 2: CAFÉ
    { 
        id: 2, 
        tipo: 'foto', 
        arquivo: "slide3.jpg", // Nome exato do arquivo no seu GitHub
        nome: "Café Expresso Grátis",        
        qtd: 50, 
        ativa: true, 
        corPrincipal: '#F37021', // Laranja
        corSecundaria: '#663300', 
        prefixo: 'CAFE',
        ehSorteio: false
    }
];
