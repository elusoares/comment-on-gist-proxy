const express = require('express');
var cors = require('cors');
const { userInfo } = require('os');
const axios = require('axios').default;
const app = express();
const port = 3000

const client_id = '044c62189110d6c5765b';
const client_secret = 'a1684b3dfd0a702f4c8594360a67f3d71ec73793';

app.options('*', cors());


app.listen(port, () => console.log(`qrGist Proxy listening at http://localhost:${port}`))

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/', (req, res) => {
    res.send('Hello World!');
});

// essa rota seria para iniciar o processo de autenticaçao,
// mas a resposta do github é uma pagina html e eu nao soube lidar com isso...
// tipo, como enviar isso de volta pro cliente?
// entao nao to usando essa rota, e sim abrindo o link de autorizaçao no proprio cliente
// usando o inappbrowser
app.get('/authorize', (req, res) => {
    axios.get('https://github.com/login/oauth/authorize', {
        params: {
          client_id:  client_id
        }
    })
    .then(function (response) {
        // handle success
        // res.send(response);
        console.log(response);
    })
    .catch(function (error) {
        // handle error
        console.log(error);
    });
    // res.redirect('https://github.com/login/oauth/authorize?client_id=044c62189110d6c5765b');
});

// rota de teste do callback do github
app.get('/callback', (req, res) => {
    console.log(req.query.code);
    const body = {
        client_id: client_id,
        client_secret: client_secret,
        scope: ['user', 'gist'],
        code: req.query.code
    };
    const options = { 
        headers: { 
            accept: 'application/json' 
        } 
    };
    axios.post('https://github.com/login/oauth/access_token', body, options)
        .then((response) => {
            // handle success
            // res.send(response);
            console.log(response.data);
            const token = response.data['access_token'];
            const options = { 
                headers: { 
                    authorization: `token ${token}` 
                } 
            };
            axios.get('https://api.github.com/user', options)
                .then((response) => {
                    userInfo = {
                        access_token: token,
                        name: response.data['name'],
                        avatar_url: response.data['avatar_url']
                    };
                    res.json(userInfo);
                    
                })
                .catch((error) => {
                    console.log(error);
                });
            
        })
        .catch((error) => {
            // handle error
            console.log(error);
        });
});

// cliente acessa essa rota mandando o code que a api retornou pra ele  
// ao abrir o link pelo inappbrowser.
// ai essa rota vai trazer o token e tambem a foto e o nome do usuario
app.get('/get-token', (req, res) => {
    const code = req.query.code; 
    // monta os parametros, incluindo o code
    // pra receber o token precisa enviar esse clientId e clientSecret
    const body = {
        client_id: client_id,
        client_secret: client_secret,
        // client_secret: 'fksfksdhfkahsdjkfhakjsfhjksd',
        code: code
        // code: 'KSDKHKASDKAldsjakd'
    };
    const options = { 
        headers: { 
            accept: 'application/json' 
        } 
    };
    // faz uma requisicao a api para q ela mande de volta o token
    axios.post('https://github.com/login/oauth/access_token', body, options)
        .then((response) => {
            // console.log(response);
            // a api vai responder com o token ou com um erro se os parametros enviados
            // nao forem validos.
            // tive que testar o erro com if. Por que sera que a api nao retorna um erro no catch nessa rota?
            const data = response.data;
            // testa pra ver se tem erro
            if (data.error) {
                // se tiver, envia de volta pro cliente
                console.log('tem erro com o token');
                // console.log(data);
                res.status(401).send(data.error);
            } else {
                // se nao, entao ta tudo certo e ai pode mandar o token
                console.log('n tem erro com o token');
                const token = response.data['access_token'];
                const options = { 
                    headers: { 
                        // authorization: `token ${token}` 
                        authorization: `token kdlfjsalsdrowieuroiruqw` 
                    } 
                };
                // requisita os dados do usuario
                axios.get('https://api.github.com/user', options)
                    .then((response) => {
                        // recebe uma resposta
                        // se der erro, vai pro catch
                        console.log('nao tem erro com os dados do user');
                        const userInfo = {
                            user: {
                                name: response.data['name'],
                                avatar_url: response.data['avatar_url']
                            },
                            token: token
                        };
                        res.json(userInfo);
                        console.log('deu certo mandar dados do usuario');            
                    })
                    .catch((error) => {
                        console.log('n deu certo: erro pedindo dados do usuario');
                        console.log(error.response.status);
                        console.log(error.response.statusText);
                        res.status(error.response.status).send(error.response.statusText);
                    });
            }
        })
        .catch((error) => {
            // erro ao pedir o token
            console.log('erro aqui no catch do token');
            // console.log(error);
        });
});

// rota para buscar um determinado gist
app.get('/get-gist', (req, res) => {
    // recebe do cliente o token e o id do gist
    const token = req.query.token;
    const gist_id = req.query.gist_id;
    const options = { 
        headers: { 
            authorization: `token ${token}` 
        }
    };
    // faz uma requisiçao à api enviando token e o id do gist
    axios.get(`https://api.github.com/gists/${gist_id}`, options)
        .then((response) => {
            // recebe uma resposta
            // se der erro, vai pro catch
            const data = response.data;
            res.json(data);
            console.log('deu certo mandar o gist');
        })
        .catch((error) => {
            console.log('erro ao pedir o gist');
            console.log(error.response.status);
            console.log(error.response.statusText);
            res.status(error.response.status).send(error.response.statusText);
        });
});

// rota para buscar os comentários de um gist
app.get('/get-comments', (req, res) => {
    // recebe do cliente o token e o id do gist
    const token = req.query.token;
    const gist_id = req.query.gist_id;
    const options = { 
        headers: { 
            authorization: `token ${token}` 
        }
    }; 
    // faz uma requisiçao à api enviando token e o id do gist
    axios.get(`https://api.github.com/gists/${gist_id}/comments`, options)
        .then((response) => {
            // recebe uma resposta
            // se der erro, vai pro catch
            const data = response.data;
            res.json(data);
            console.log('deu certo mandar os comments');
        })
        .catch((error) => {
            console.log('erro catch comments');
            console.log(error.response.status);
            console.log(error.response.statusText);
            res.status(error.response.status).send(error.response.statusText);
        });
});

// essa rota vai postar um comentario em determinado gist
app.get('/post-comment', (req, res) => {
    // recebe do cliente o token, o comentario e o id do gist
    const comment = req.query.comment; 
    const gist_id = req.query.gist_id;
    const token = req.query.token;
    console.log(comment);
    console.log(gist_id);
    console.log(token);
    // monta os parametros, incluindo o comentario
    // pra receber o token precisa enviar esse clientId e clientSecret
    const body = {
        body: comment
    };
    const options = { 
        headers: { 
            authorization: `token ${token}` 
        }
    };
    // envia o comentario a api
    axios.post(`https://api.github.com/gists/${gist_id}/comments`, body, options)
        .then((response) => {
            // a api vai responder com status 201 ou com um erro se os parametros enviados
            // nao forem validos
            const data = response.data;
            res.json(data);            
        })
        .catch((error) => {
            // erro ao postar comentario
            console.log('erro aqui no catch do comentario');
            console.log(error);
            res.status(error.response.status).send(error.response.statusText);
        });
});




