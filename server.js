
import express from 'express';
import path from 'node:path';
import { PORT } from './config/declare.js';
import router from './routes.js';

const app = express();
const ROOT = import.meta.dirname;

app.use(express.json());

app.use('/api/forms', router);

app.use(express.static(path.join(ROOT, 'public')));

app.use('/alpine', express.static(
    path.join(ROOT, 'node_modules/alpinejs/dist')
));
// Страницы
app.get('/', (req, res) => {
    res.redirect('/admin');
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(ROOT, 'public/admin.html'));
});

app.get('/f/:id', (req, res) => {
    res.sendFile(path.join(ROOT, 'public/form.html'));
});

app.listen(PORT, () => {
    console.log(`Server: http://localhost:${PORT}`);
});
