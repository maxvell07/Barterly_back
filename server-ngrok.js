const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 4040; // Изменил порт на 4040
const host = '127.0.0.1'; // Явно указал локальный хост

// Основная папка для хранения картинок
const baseDirectory = path.join(__dirname, 'images');

// Создание основной папки, если её нет
if (!fs.existsSync(baseDirectory)) {
    fs.mkdirSync(baseDirectory);
}

// Настройка хранилища для multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const folderName = req.params.folderName;
        const folderPath = path.join(baseDirectory, folderName);
        
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }
        cb(null, folderPath);
    },
    filename: (req, file, cb) => {
        const filename = req.params.filename || file.originalname;
        cb(null, filename);
    }
});

const upload = multer({ storage: storage });

// Эндпоинт для загрузки нового файла
app.post('/upload/:folderName', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('Файл не загружен!');
    }
    res.send(`Файл "${req.file.originalname}" успешно загружен в папку "${req.params.folderName}"!`);
});

// Эндпоинт для редактирования (замены) файла
app.put('/upload/:folderName/:filename', upload.single('image'), (req, res) => {
    const folderName = req.params.folderName;
    const filename = req.params.filename;
    const filePath = path.join(baseDirectory, folderName, filename);

    if (!fs.existsSync(filePath)) {
        fs.writeFile(filePath, req.file.buffer, err => {
            if (err) {
                console.error(err);
                return res.status(500).send('Ошибка при создании файла!');
            }
            return res.send(`Файл "${filename}" в папке "${folderName}" успешно создан!`);
        });
    } else {
        res.send(`Файл "${filename}" в папке "${folderName}" успешно обновлён!`);
    }
});

// Эндпоинт для удаления файла
app.delete('/upload/:folderName/:filename', (req, res) => {
    const folderName = req.params.folderName;
    const filename = req.params.filename;
    const filePath = path.join(baseDirectory, folderName, filename);

    if (fs.existsSync(filePath)) {
        fs.unlink(filePath, err => {
            if (err) {
                console.error("Ошибка при удалении файла:", err);
                return res.status(500).send('Ошибка при удалении файла!');
            }
            return res.send(`Файл "${filename}" в папке "${folderName}" успешно удалён!`);
        });
    } else {
        return res.send(`Файл "${filename}" в папке "${folderName}" не найден, но это не проблема.`);
    }
});

// Эндпоинт для удаления всех изображений в папке
app.delete('/images/:folderName', (req, res) => {
    const folderName = req.params.folderName;
    const folderPath = path.join(baseDirectory, folderName);

    if (fs.existsSync(folderPath)) {
        fs.readdir(folderPath, (err, files) => {
            if (err) {
                console.error("Ошибка при чтении папки:", err);
                return res.status(500).send('Ошибка при чтении папки!');
            }

            files.forEach(file => {
                const filePath = path.join(folderPath, file);
                fs.unlink(filePath, err => {
                    if (err) {
                        console.error("Ошибка при удалении файла:", err);
                    }
                });
            });

            res.send(`Все файлы в папке "${folderName}" успешно удалены!`);
        });
    } else {
        res.status(404).send('Папка не найдена!');
    }
});

// Эндпоинт для получения изображения
app.get('/images/:folderName/:filename', (req, res) => {
    const { folderName, filename } = req.params;
    const filePath = path.join(baseDirectory, folderName, filename);

    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('Изображение не найдено!');
    }
});

// Эндпоинт для получения количества изображений в папке
app.get('/images/:folderName/count', (req, res) => {
    const folderName = req.params.folderName;
    const folderPath = path.join(baseDirectory, folderName);

    if (fs.existsSync(folderPath)) {
        fs.readdir(folderPath, (err, files) => {
            if (err) {
                console.error(err);
                return res.status(500).send('0');
            }
            const imageCount = files.length;
            res.send(imageCount.toString());
        });
    } else {
        res.send("0");
    }
});

app.listen(port, host, () => {
    console.log(`Сервер запущен на http://${host}:${port}`);
});
