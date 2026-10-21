
import { Router } from 'express';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { DB } from './config/declare.js';

const router = Router();

const readDb = () => JSON.parse(fs.readFileSync(DB, 'utf8'));

const saveDb = (data) => {
    fs.writeFileSync(DB, JSON.stringify(data, null, 2));
};

// Список форм
router.get('/', (req, res) => {
    const db = readDb();

    const forms = db.forms.map(form => ({
        ...form,
        views: form.views || 0,
        submissions: db.responses.filter(
            r => r.formId === form.id
        ).length
    }));

    res.json(forms);
});

// Создание формы
router.post('/', (req, res) => {
    const { title, fields } = req.body ?? {};

    const db = readDb();

    const form = {
        id: randomUUID(),
        title: title.trim(),
        fields,
        status: 'draft',
        views: 0,
        createdAt: new Date().toISOString()
    };

    db.forms.push(form);
    saveDb(db);

    res.status(201).json({
        ...form,
        url: `/f/${form.id}`
    });
});

// Получение ответов
router.get('/:id/responses', (req, res) => {
    const db = readDb();

    const form = db.forms.find(f => f.id === req.params.id);
    if (!form) {
        return res.status(404).json({ error: 'Форма не найдена' });
    }

    res.json(db.responses.filter(r => r.formId === form.id));
});

// Получение формы
router.get('/:id', (req, res) => {
    const form = readDb().forms.find(f => f.id === req.params.id);

    if (!form) {
        return res.status(404).json({ error: 'Форма не найдена' });
    }

    res.json(form);
});

// Отправка ответа студента
router.post('/:id/submit', (req, res) => {
    const db = readDb();
    const form = db.forms.find(f => f.id === req.params.id);

    if (!form) {
        return res.status(404).json({ error: 'Форма не найдена' });
    }

    const answers = req.body?.answers;

    const cleanAnswers = {};

    for (const field of form.fields) {
        const value = answers[field.name] ?? '';

        if (field.required && !value.trim()) {
            return res.status(400).json({
                error: `Заполните поле: ${field.name}`
            });
        }

        if (
            field.type === 'email' &&
            value.trim() &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
        ) {
            return res.status(400).json({ error: `Некорректный email: ${field.name}` });
        }

        cleanAnswers[field.name] = value;
    }

    db.responses.push({
        id: randomUUID(),
        formId: form.id,
        answers: cleanAnswers,
        createdAt: new Date().toISOString()
    });

    saveDb(db);

    res.status(201).json({ success: true });
});


router.post('/:id/publish', (req, res) => {
    const db = readDb();

    const form = db.forms.find(f => f.id === req.params.id);

    if (!form) {
        return res.status(404).json({ error: 'Форма не найдена' });
    }

    form.status = 'published';

    saveDb(db);

    res.json({
        success: true,
        url: `/f/${form.id}`
    });
});
router.post('/:id/view', (req, res) => {
    const db = readDb();
    const form = db.forms.find(f => f.id === req.params.id);

    if (!form || form.status !== 'published') {
        return res.status(404).json({ error: 'Форма не найдена' });
    }

    form.views = (form.views || 0) + 1;

    saveDb(db);

    res.json({ success: true });
});


export default router;
