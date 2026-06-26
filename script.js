// --- FUNÇÕES GLOBAIS ---

// Busca no localStorage quem é o usuário que tá logado agora
function obterPerfilLogado() {
    const emailLogado = localStorage.getItem('sessaoAtivaBelezaHub');
    if (!emailLogado) return null;
    
    const usuarios = JSON.parse(localStorage.getItem('usuariosBelezaHub')) || [];
    // Usa o .find() pra achar direto em vez de fazer um for gigante
    return usuarios.find(u => u.email === emailLogado) || null;
}

// Preenche a tabela de horários do cliente na página de perfil
function carregarAgendamentosCliente() {
    const tabelaBody = document.getElementById('tabela-atendimentos-perfil');
    if (!tabelaBody) return;

    const lista = JSON.parse(localStorage.getItem('agendamentosBelezaHub')) || [];
    tabelaBody.innerHTML = "";

    if (lista.length === 0) {
        tabelaBody.innerHTML = "<tr><td colspan='3' class='text-center'>Nenhum agendamento ativo. <a href='agendamento.html' style='font-weight:bold; text-decoration: underline;'>Agendar agora</a></td></tr>";
        return;
    }

    // Passa por cada agendamento e cria a linha na tabela
    for (let item of lista) {
        // Arruma a data pra ficar no formato BR (DD/MM/AAAA)
        const partesData = item.data.split('-');
        const dataFormatada = `${partesData[2]}/${partesData[1]}/${partesData[0]}`;

        const linha = document.createElement('tr');
        let acoesHtml = "";
        
        // Se já cancelou, não deixa remarcar nem cancelar de novo
        if (item.status === "Cancelado") {
            acoesHtml = `<span style="color: #ff4d4d; font-weight: bold; text-transform: uppercase; font-size: 0.85rem;">Cancelado</span>`;
        } else {
            acoesHtml = `
                <button onclick="acionarRemarcacao(${item.id})" class="btn-acao-tabela btn-remarcar-item">Remarcar</button>
                <button onclick="acionarExclusao(${item.id})" class="btn-acao-tabela btn-cancelar-item">Cancelar</button>
            `;
        }

        linha.innerHTML = `
            <td>${item.servico} (${item.profissional})</td>
            <td>${dataFormatada} às ${item.horario}</td>
            <td>${acoesHtml}</td>
        `;
        tabelaBody.appendChild(linha);
    }
}

// Abre o modal de remarcar e já preenche com os dados antigos
function acionarRemarcacao(id) {
    const lista = JSON.parse(localStorage.getItem('agendamentosBelezaHub')) || [];
    const agendamento = lista.find(a => a.id == id);
    
    if (agendamento) {
        document.getElementById('remarcar-id').value = agendamento.id;
        document.getElementById('info-servico-remarcar').innerText = "Serviço: " + agendamento.servico;
        document.getElementById('remarcar-data').value = agendamento.data;
        document.getElementById('remarcar-horario').value = agendamento.horario;
        document.getElementById('modal-remarcar').classList.remove('display-none');
    }
}

// Exclusão lógica
function acionarExclusao(id) {
    if (confirm("Deseja realmente cancelar este serviço?")) {
        let lista = JSON.parse(localStorage.getItem('agendamentosBelezaHub')) || [];
        
        let agendamento = lista.find(a => a.id == id);
        if (agendamento) {
            agendamento.status = "Cancelado";
            localStorage.setItem('agendamentosBelezaHub', JSON.stringify(lista));
            alert("Reserva cancelada com sucesso.");
            carregarAgendamentosCliente(); // Atualiza a tabela na hora
        }
    }
}

// Calcula os dados pro painel do profissional (página de gestão)
function gerarRelatoriosGestor() {
    const indTotal = document.getElementById('ind-total-servicos');
    const indFaturamento = document.getElementById('ind-faturamento');
    const tabelaProfissional = document.getElementById('tabela-atendimentos-profissional');
    const indCancelamento = document.querySelector('.valor-indicador.text-verde') || document.querySelector('.text-verde');
    
    if (!indTotal || !indFaturamento || !tabelaProfissional) return;

    const perfilObj = obterPerfilLogado();
    if (document.getElementById('texto-descricao-gestao')) {
        document.getElementById('texto-descricao-gestao').innerText = `Logado como: ${perfilObj.nome}. Dados atualizados em tempo real.`;
    }

    const lista = JSON.parse(localStorage.getItem('agendamentosBelezaHub')) || [];
    // Filtra só os agendamentos que são pra esse profissional
    const meusAtendimentos = lista.filter(a => a.profissional === perfilObj.nome);

    let totalConfirmados = 0;
    let totalCancelados = 0;
    let faturamento = 0;

    tabelaProfissional.innerHTML = "";

    meusAtendimentos.forEach(item => {
        if (item.status === "Cancelado") {
            totalCancelados++;
        } else {
            totalConfirmados++;
            faturamento += item.preco;
            
            // Já adiciona na tabela os que tão confirmados
            const partesData = item.data.split('-');
            const dataF = `${partesData[2]}/${partesData[1]}/${partesData[0]}`;
            const linha = document.createElement('tr');
            linha.innerHTML = `
                <td><strong>${dataF} às ${item.horario}</strong></td>
                <td>${item.servico}</td>
                <td>Cliente Ativo</td>
            `;
            tabelaProfissional.appendChild(linha);
        }
    });

    indTotal.innerText = totalConfirmados;
    indFaturamento.innerText = "R$ " + faturamento.toFixed(2).replace('.', ',');

    // Calcula a porcentagem de cancelamento
    let taxaCancelamento = meusAtendimentos.length > 0 ? (totalCancelados / meusAtendimentos.length) * 100 : 0;
    
    if (indCancelamento) {
        indCancelamento.innerText = taxaCancelamento.toFixed(0) + "%";
        // Fica vermelho se passar de 20% pra chamar atenção
        indCancelamento.style.color = taxaCancelamento > 20 ? "#ff4d4d" : ""; 
    }

    if (totalConfirmados === 0) {
        tabelaProfissional.innerHTML = "<tr><td colspan='3' class='text-center'>Nenhum procedimento agendado pra você.</td></tr>";
    }
}


// --- QUANDO A PÁGINA CARREGAR ---
document.addEventListener("DOMContentLoaded", function() {

    // 1. TEMA ESCURO
    const btnTema = document.getElementById('btn-tema');
    if (btnTema) {
        // Verifica se já tava escuro antes
        if (localStorage.getItem('temaBelezaHub') === 'escuro') {
            document.body.classList.add('tema-escuro');
            btnTema.innerText = '☀️';
        }

        // Troca o tema quando clica no botão
        btnTema.addEventListener('click', function() {
            document.body.classList.toggle('tema-escuro');
            const taEscuro = document.body.classList.contains('tema-escuro');
            
            localStorage.setItem('temaBelezaHub', taEscuro ? 'escuro' : 'claro');
            btnTema.innerText = taEscuro ? '☀️' : '🌙';
        });
    }

    // 2. CONTROLE DE ACESSO (Esconde menus e bloqueia páginas)
    function gerenciarMenuERotas() {
        const perfilObj = obterPerfilLogado();
        const paginaAtual = window.location.pathname.split("/").pop();
        
        const linkCadastro = document.getElementById('link-cadastro');
        const linkLogin = document.getElementById('link-login');
        const linkAgendamento = document.getElementById('link-agendamento');
        const linkGestao = document.getElementById('link-gestao');
        const linkPerfil = document.getElementById('link-perfil');

        if (perfilObj) {
            // Usuário tá logado
            if (linkCadastro) linkCadastro.classList.add('display-none');
            if (linkLogin) linkLogin.classList.add('display-none');
            if (linkPerfil) linkPerfil.classList.remove('display-none');
            
            // Define o que ele pode ver dependendo do tipo de conta
            if (perfilObj.tipo === 'profissional') {
                if (linkAgendamento) linkAgendamento.classList.add('display-none');
                if (linkGestao) linkGestao.classList.remove('display-none');
            } else {
                if (linkAgendamento) linkAgendamento.classList.remove('display-none');
                if (linkGestao) linkGestao.classList.add('display-none');
            }
        } else {
            // Não tá logado
            if (linkCadastro) linkCadastro.classList.remove('display-none');
            if (linkLogin) linkLogin.classList.remove('display-none');
            if (linkAgendamento) linkAgendamento.classList.add('display-none');
            if (linkGestao) linkGestao.classList.add('display-none');
            if (linkPerfil) linkPerfil.classList.add('display-none');

            // Protege as rotas pra ninguém entrar digitando a URL direto
            const paginasFechadas = ["agendamento.html", "perfil.html", "gestao.html"];
            if (paginasFechadas.includes(paginaAtual)) {
                alert("Opa! Você precisa fazer login primeiro.");
                window.location.href = "login.html";
            }
        }
    }
    gerenciarMenuERotas();

    // 3. MUDANÇA NA PÁGINA INICIAL (Se já tiver logado, muda os botões)
    const paginaAtual = window.location.pathname.split("/").pop();
    if ((paginaAtual === "index.html" || paginaAtual === "") && obterPerfilLogado()) {
        const dadosPerfil = obterPerfilLogado();
        const primeiroNome = dadosPerfil.nome.split(" ")[0]; // Pega só o primeiro nome
        const botoesHero = document.querySelector('.grupo-botoes-hero');
        
        if (dadosPerfil.tipo === 'profissional') {
            document.getElementById('hero-titulo').innerText = `Bem-vindo de volta, Pro. ${primeiroNome}! 💼`;
            document.getElementById('hero-texto').innerText = "Acesse o menu de Gestão para monitorar seus faturamentos e atendimentos.";
            botoesHero.innerHTML = `
                <a href="gestao.html" class="botao-principal">Estatísticas de Gestão</a>
                <a href="perfil.html" class="botao-secundario">Meus Dados Cadastrais</a>
            `;
        } else {
            document.getElementById('hero-titulo').innerText = `Olá, ${primeiroNome}! ✨`;
            document.getElementById('hero-texto').innerText = "Escolha entre os nossos especialistas e agende seu horário online.";
            botoesHero.innerHTML = `
                <a href="agendamento.html" class="botao-principal">Agendar Novo Horário</a>
                <a href="perfil.html" class="botao-secundario">Ver Meus Agendamentos</a>
            `;
        }
    }

    // 4. LOGIN
    const formLogin = document.getElementById('formulario-login');
    if (formLogin) {
        formLogin.addEventListener('submit', function(e) {
            e.preventDefault();
            const emailDigitado = document.getElementById('login-email').value;
            const senhaDigitada = document.getElementById('login-senha').value;

            const usuarios = JSON.parse(localStorage.getItem('usuariosBelezaHub')) || [];
            const usuarioLocalizado = usuarios.find(u => u.email === emailDigitado);

            if (usuarioLocalizado) {
                if (usuarioLocalizado.senha === senhaDigitada) {
                    localStorage.setItem('sessaoAtivaBelezaHub', emailDigitado);
                    alert(`Login feito com sucesso! Bem-vindo(a) ${usuarioLocalizado.nome.split(" ")[0]}.`);
                    window.location.href = "perfil.html";
                } else {
                    alert("Senha incorreta! Tenta de novo.");
                }
            } else {
                alert("E-mail não encontrado. Você precisa criar uma conta primeiro!");
            }
        });
    }

    // 5. CADASTRO
    const formCadastro = document.getElementById('formulario-cadastro');
    if (formCadastro) {
        formCadastro.addEventListener('submit', function(e) {
            e.preventDefault();
            const emailInput = document.getElementById('cad-email').value;
            let usuarios = JSON.parse(localStorage.getItem('usuariosBelezaHub')) || [];

            // Verifica se o email já existe pra não dar conflito
            if (usuarios.find(u => u.email === emailInput)) {
                alert("Este e-mail já está cadastrado!");
                return;
            }

            const novoUsuario = {
                nome: document.getElementById('cad-nome').value,
                email: emailInput,
                telefone: document.getElementById('cad-telefone').value,
                tipo: document.getElementById('cad-tipo').value,
                senha: document.getElementById('cad-senha').value
            };

            usuarios.push(novoUsuario);
            localStorage.setItem('usuariosBelezaHub', JSON.stringify(usuarios));
            localStorage.setItem('sessaoAtivaBelezaHub', emailInput); // Já loga o cara na hora
            
            alert("Conta criada com sucesso!");
            window.location.href = "perfil.html";
        });
    }

    // 6. AGENDAMENTO
    const selectProfissional = document.getElementById('profissional');
    if (selectProfissional) {
        const usuarios = JSON.parse(localStorage.getItem('usuariosBelezaHub')) || [];
        const profissionais = usuarios.filter(u => u.tipo === 'profissional');
        
        selectProfissional.innerHTML = '<option value="">-- Escolha um Profissional --</option>';
        
        // Coloca os profissionais cadastrados no select dinamicamente
        profissionais.forEach(pro => {
            const opt = document.createElement('option');
            opt.value = pro.nome;
            opt.innerText = pro.nome;
            selectProfissional.appendChild(opt);
        });

        if (profissionais.length === 0) {
            selectProfissional.innerHTML = '<option value="">-- Nenhum profissional cadastrado --</option>';
        }
    }

    const formAgendamento = document.getElementById('formulario-agendamento');
    if (formAgendamento) {
        formAgendamento.addEventListener('submit', function(e) {
            e.preventDefault();

            // Pega o valor do radio button que tá marcado
            const dataSelecionada = document.querySelector('input[name="data"]:checked')?.value;
            const selectServico = document.getElementById('servico');
            const selectHorario = document.getElementById('horario');

            if (!selectServico.value || !selectHorario.value || !selectProfissional.value || !dataSelecionada) {
                alert("Preenche tudo aí, por favor!");
                return;
            }

            // Define o preço na mão baseado no value do select
            let preco = selectServico.value === "cabelo" ? 80 : (selectServico.value === "manicure" ? 50 : 120);

            const novoAgendamento = {
                id: Date.now(), // Gera um ID único de um jeito fácil
                servico: selectServico.options[selectServico.selectedIndex].text,
                profissional: selectProfissional.value,
                data: dataSelecionada,
                horario: selectHorario.value,
                preco: preco,
                status: "Confirmado"
            };

            let lista = JSON.parse(localStorage.getItem('agendamentosBelezaHub')) || [];
            lista.push(novoAgendamento);
            localStorage.setItem('agendamentosBelezaHub', JSON.stringify(lista));

            alert("Horário agendado com sucesso!");
            window.location.href = "perfil.html";
        });
    }

    // 7. PÁGINA DE PERFIL (Dados e Histórico)
    const colDados = document.getElementById('coluna-dados-perfil');
    const colHist = document.getElementById('coluna-historico-perfil');

    if (colDados && colHist) {
        const perfilObj = obterPerfilLogado();
        if (perfilObj) {
            // Joga os dados do storage pros inputs do form
            document.getElementById('nome').value = perfilObj.nome;
            document.getElementById('email').value = perfilObj.email;
            document.getElementById('telefone').value = perfilObj.telefone;
            document.getElementById('tipo').value = perfilObj.tipo;

            // Se for profissional, esconde a tabela de agendamentos e deixa o form largo
            if (perfilObj.tipo === 'profissional') {
                colDados.className = 'coluna-1';
                colHist.classList.add('display-none');
            } else {
                colDados.className = 'coluna-2';
                colHist.classList.remove('display-none');
                carregarAgendamentosCliente();
            }
        }
    }

    // Atualizar dados do perfil
    const formPerfil = document.getElementById('formulario-perfil');
    if (formPerfil) {
        formPerfil.addEventListener('submit', function(e) {
            e.preventDefault();
            if (confirm("Quer mesmo alterar seus dados?")) {
                const emailLogado = localStorage.getItem('sessaoAtivaBelezaHub');
                let usuarios = JSON.parse(localStorage.getItem('usuariosBelezaHub')) || [];
                const novoEmail = document.getElementById('email').value;

                // Vê se o e-mail novo já não é de outra pessoa
                if (usuarios.find(u => u.email === novoEmail && u.email !== emailLogado)) {
                    alert("Esse e-mail já tá em uso por outra conta!");
                    return;
                }

                // Atualiza o objeto no array
                let index = usuarios.findIndex(u => u.email === emailLogado);
                if (index !== -1) {
                    usuarios[index].nome = document.getElementById('nome').value;
                    usuarios[index].email = novoEmail;
                    usuarios[index].telefone = document.getElementById('telefone').value;
                    usuarios[index].tipo = document.getElementById('tipo').value;
                }

                localStorage.setItem('usuariosBelezaHub', JSON.stringify(usuarios));
                localStorage.setItem('sessaoAtivaBelezaHub', novoEmail); 
                
                alert("Tudo salvo!");
                window.location.reload(); 
            }
        });
    }

    // 8. LOGOFF E EXCLUIR CONTA
    const btnSair = document.getElementById('btn-sair-perfil');
    if (btnSair) {
        btnSair.addEventListener('click', function() {
            if (confirm("Quer mesmo sair?")) {
                localStorage.removeItem('sessaoAtivaBelezaHub');
                window.location.href = "index.html";
            }
        });
    }

    const btnExcluir = document.getElementById('btn-excluir-perfil');
    if (btnExcluir) {
        btnExcluir.addEventListener('click', function() {
            if (confirm("🚨 ATENÇÃO: Tem certeza que quer apagar sua conta pra sempre?")) {
                const emailLogado = localStorage.getItem('sessaoAtivaBelezaHub');
                let usuarios = JSON.parse(localStorage.getItem('usuariosBelezaHub')) || [];
                
                // Filtra tirando o usuário atual (apaga ele do array)
                usuarios = usuarios.filter(u => u.email !== emailLogado);
                
                localStorage.setItem('usuariosBelezaHub', JSON.stringify(usuarios));
                localStorage.removeItem('sessaoAtivaBelezaHub');
                alert("Conta excluída. Adeus!");
                window.location.href = "index.html";
            }
        });
    }

    // 9. MODAL DE REMARCAÇÃO
    const btnFecharModal = document.getElementById('btn-fechar-modal');
    if (btnFecharModal) {
        btnFecharModal.addEventListener('click', () => {
            document.getElementById('modal-remarcar').classList.add('display-none');
        });
    }

    const formRemarcar = document.getElementById('formulario-remarcar');
    if (formRemarcar) {
        formRemarcar.addEventListener('submit', function(e) {
            e.preventDefault();
            const idAlvo = document.getElementById('remarcar-id').value;
            let lista = JSON.parse(localStorage.getItem('agendamentosBelezaHub')) || [];
            
            let agendamento = lista.find(a => a.id == idAlvo);
            if (agendamento) {
                agendamento.data = document.getElementById('remarcar-data').value;
                agendamento.horario = document.getElementById('remarcar-horario').value;
                
                localStorage.setItem('agendamentosBelezaHub', JSON.stringify(lista));
                alert("Horário remarcado com sucesso!");
                document.getElementById('modal-remarcar').classList.add('display-none');
                carregarAgendamentosCliente();
            }
        });
    }

    // 10. CHAMA OS RELATÓRIOS SE TIVER NA TELA DE GESTÃO
    if (window.location.pathname.split("/").pop() === "gestao.html") {
        gerarRelatoriosGestor();
    }
});