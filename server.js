const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Основная папка для хранения картинок
const baseDirectory = path.join(__dirname, 'images');

// Создание основной папки, если её нет
if (!fs.existsSync(baseDirectory)) {
    fs.mkdirSync(baseDirectory);
}

// Настройка хранилища для multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Получаем имя папки из параметров запроса
        const folderName = req.params.folderName;
        const folderPath = path.join(baseDirectory, folderName);
        
        // Создаём папку, если её нет (рекурсивно)
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }
        cb(null, folderPath);
    },
    filename: (req, file, cb) => {
        // Если в запросе присутствует параметр filename (например, для PUT-запроса),
        // то используем его в качестве имени файла, иначе - оригинальное имя файла.
        const filename = req.params.filename || file.originalname;
        cb(null, filename);
    }
});

const upload = multer({ storage: storage });

// Эндпоинт для загрузки нового файла (POST-запрос)
app.post('/upload/:folderName', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('Файл не загружен!');
    }
    res.send(`Файл "${req.file.originalname}" успешно загружен в папку "${req.params.folderName}"!`);
});

// Эндпоинт для редактирования (замены) файла (PUT-запрос)
app.put('/upload/:folderName/:filename', upload.single('image'), (req, res) => {
    const folderName = req.params.folderName;
    const filename = req.params.filename;
    const filePath = path.join(baseDirectory, folderName, filename);

    // Если файла для редактирования нет, создаём его
    if (!fs.existsSync(filePath)) {
        fs.writeFile(filePath, req.file.buffer, err => {
            if (err) {
                console.error(err);
                return res.status(500).send('Ошибка при создании файла!');
            }
            return res.send(`Файл "${filename}" в папке "${folderName}" успешно создан!`);
        });
    } else {
        // Если файл есть, новый файл (из запроса) заменит старый
        res.send(`Файл "${filename}" в папке "${folderName}" успешно обновлён!`);
    }
});

// Эндпоинт для удаления файла (DELETE-запрос)
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

//Эндпоинт для удаления всех изображений в папке (DELETE-запрос)
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
app.delete('/images/:folderName', (req, res) => {
    const folderName = req.params.folderName;
    const folderPath = path.join(baseDirectory, folderName);

    if (!fs.existsSync(folderPath)) {
        return res.status(404).send('Папка не найдена!');
    }

    // Функция для рекурсивного удаления папки и всех её файлов
    fs.rm(folderPath, { recursive: true, force: true }, (err) => {
        if (err) {
            console.error("Ошибка при удалении папки:", err);
            return res.status(500).send('Ошибка при удалении папки!');
        }
        res.send(`Папка "${folderName}" и все её файлы успешно удалены!`);
    });
});

// Эндпоинт для получения изображения (GET-запрос)
app.get('/images/:folderName/:filename', (req, res) => {
    const { folderName, filename } = req.params;
    const filePath = path.join(baseDirectory, folderName, filename);

    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('Изображение не найдено!');
    }
});

// Эндпоинт для получения количества изображений в папке (GET-запрос)
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
        // Если папка не найдена, возвращаем "0"
        res.send("0");
    }
});


app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});
