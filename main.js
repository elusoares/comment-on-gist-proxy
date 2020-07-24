const express = require('express');
var cors = require('cors');
const { userInfo } = require('os');
const axios = require('axios').default;
const app = express();
const port = 3000

const client_id = '044c62189110d6c5765b';
const client_secret = 'a1684b3dfd0a702f4c8594360a67f3d71ec73793';

app.options('*', cors());


app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/', (req, res) => {
    res.send('Hello World!');
});

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

// cliente acessa essa rota mandando o code
app.get('/get-token', (req, res) => {
    const code = req.query.code; 
    console.log('code');
    console.log(code);
    // monta os parametros, incluindo o code
    const body = {
        client_id: client_id,
        client_secret: client_secret,
        scope: ['user', 'gist'],
        code: code
    };
    const options = { 
        headers: { 
            accept: 'application/json' 
        } 
    };
    // faz uma requisicao a api para q ela mande de volta o token
    axios.post('https://github.com/login/oauth/access_token', body, options)
        .then((response) => {
            // a api vai responder com o token ou com um erro se os parametros enviados nao forem validos
            const data = response.data;
            // testa pra ver se tem erro
            if (data.error) {
                // se tiver, envia de volta pro cliente
                console.log('tem erro com o token');
                console.log(data);
                res.status(401).send(data.error);
            } else {
                // se nao, entao ta tudo certo e ai pode mandar o token
                console.log('n tem erro com o token');
                const token = response.data['access_token'];
                const options = { 
                    headers: { 
                        authorization: `token ${token}` 
                    } 
                };
                // requisita os dados do usuario
                axios.get('https://api.github.com/user', options)
                    .then((response) => {
                        // por enquanto, tenho interesse apenas no nome e na foto
                        // a api vai responder com os dados ou com um erro se os parametros enviados nao forem validos
                        const data = response.data;
                        //testa pra ver se tem erro
                        if(data.error) {
                            // se tiver, envia de volta pro cliente
                            console.log('tem erro com os dados do user');
                            console.log(data);
                            res.status(401).send(data.error);
                        } else {
                            // se nao, ta tudo certo
                            console.log('nao tem erro com os dados do user');
                            const userInfo = {
                                data: {
                                    name: response.data['name'],
                                    avatar_url: response.data['avatar_url']
                                },
                                token: token
                            };
                            res.json(userInfo);
                            console.log('deu certo mandar dados do usuario');
                        }            
                    })
                    .catch((error) => {
                        console.log(error);
                        // console.log(error.response);
                        console.log('n deu certo: erro pedindo dados do usuario');
                        // res.send(error.data)
                    });
            }
        })
        .catch((error) => {
            // erro ao pedir o token
            console.log('erro aqui no catch do token');
            console.log(error);
        });
});

// cliente acessa essa rota mandando o token
app.get('/get-user-data', (req, res) => {
    const token = req.query.token;
    console.log('token');
    console.log(token);
    
});




