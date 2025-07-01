import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Sequelize, DataTypes } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어
app.use(cors());
app.use(express.json());

// SQLite 데이터베이스 설정
const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: "./database.sqlite",
    logging: false,
});

// 사용자 모델
const User = sequelize.define("User", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    username: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
    },
    company: {
        type: DataTypes.STRING,
        allowNull: true,
    },
});

// 프로젝트 태스크 모델
const ProjectTask = sequelize.define("ProjectTask", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    start: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    end: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    progress: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    type: {
        type: DataTypes.STRING,
        defaultValue: "task",
    },
    isDisabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    company: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    styles: {
        type: DataTypes.TEXT,
        get() {
            const rawValue = this.getDataValue("styles");
            return rawValue ? JSON.parse(rawValue) : {};
        },
        set(value) {
            this.setDataValue("styles", JSON.stringify(value));
        },
    },
});

// 관계 설정
User.hasMany(ProjectTask);
ProjectTask.belongsTo(User);

// JWT 미들웨어
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "액세스 토큰이 필요합니다." });
    }

    jwt.verify(
        token,
        process.env.JWT_SECRET || "your-secret-key",
        (err, user) => {
            if (err) {
                return res
                    .status(403)
                    .json({ message: "유효하지 않은 토큰입니다." });
            }
            req.user = user;
            next();
        }
    );
};

// 데이터베이스 초기화
sequelize.sync({ force: false }).then(() => {
    console.log("데이터베이스가 동기화되었습니다.");
    User.findOrCreate({
        where: { username: "admin" },
        defaults: {
            username: "admin",
            password: bcrypt.hashSync("admin!", 10),
            email: "admin@crossingdelta.com",
            company: "CrossingDelta",
        },
    }).then(([user, created]) => {
        if (created) {
            console.log("기본 관리자 계정이 생성되었습니다. (admin/admin!)");
        }
    });
    User.findOrCreate({
        where: { username: "StudioFree" },
        defaults: {
            username: "StudioFree",
            password: bcrypt.hashSync("StudioFree!", 10),
            email: "admin@free.com",
            company: "StudioFree",
        },
    }).then(([user, created]) => {
        if (created) {
            console.log(
                "기본 관리자 계정이 생성되었습니다. (StudioFree/StudioFree!)"
            );
        }
    });
});

app.post("/api/auth/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res
                .status(400)
                .json({ message: "사용자명과 비밀번호를 입력해주세요." });
        }

        const user = await User.findOne({ where: { username } });

        if (!user) {
            return res
                .status(400)
                .json({ message: "잘못된 아이디 또는 비밀번호 입니다." });
        }

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res
                .status(400)
                .json({ message: "잘못된 아이디 또는 비밀번호 입니다." });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, company: user.company },
            process.env.JWT_SECRET || "your-secret-key",
            { expiresIn: "24h" }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                company: user.company,
            },
        });
    } catch (error) {
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
});

// 프로젝트 태스크 라우트
app.get("/api/tasks", authenticateToken, async (req, res) => {
    try {
        const tasks = await ProjectTask.findAll({
            where: { company: req.user.company },
            order: [["start", "ASC"]],
        });

        const formattedTasks = tasks.map((task) => ({
            id: task.id,
            name: task.name,
            start: task.start,
            end: task.end,
            progress: task.progress,
            type: task.type,
            isDisabled: task.isDisabled,
            styles: task.styles,
        }));

        res.json(formattedTasks);
    } catch (error) {
        res.status(500).json({
            message: "태스크를 가져오는 중 오류가 발생했습니다.",
        });
    }
});

app.post("/api/tasks", authenticateToken, async (req, res) => {
    try {
        const { name, start, end, progress, type, isDisabled, styles } =
            req.body;

        if (!name || !start || !end) {
            return res
                .status(400)
                .json({ message: "필수 필드를 입력해주세요." });
        }

        const task = await ProjectTask.create({
            name,
            start: new Date(start),
            end: new Date(end),
            progress: progress || 0,
            type: type || "task",
            isDisabled: isDisabled || false,
            company: req.user.company,
            styles: styles || {},
            UserId: req.user.id,
        });

        res.json({
            id: task.id,
            name: task.name,
            start: task.start,
            end: task.end,
            progress: task.progress,
            type: task.type,
            isDisabled: task.isDisabled,
            styles: task.styles,
        });
    } catch (error) {
        res.status(500).json({
            message: "태스크 생성 중 오류가 발생했습니다.",
        });
    }
});

app.put("/api/tasks/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, start, end, progress, type, isDisabled, styles } =
            req.body;

        const task = await ProjectTask.findOne({
            where: { id, company: req.user.company },
        });

        if (!task) {
            return res
                .status(404)
                .json({ message: "태스크를 찾을 수 없습니다." });
        }

        await task.update({
            name: name || task.name,
            start: start ? new Date(start) : task.start,
            end: end ? new Date(end) : task.end,
            progress: progress !== undefined ? progress : task.progress,
            type: type || task.type,
            isDisabled: isDisabled !== undefined ? isDisabled : task.isDisabled,
            styles: styles || task.styles,
        });

        res.json({
            id: task.id,
            name: task.name,
            start: task.start,
            end: task.end,
            progress: task.progress,
            type: task.type,
            isDisabled: task.isDisabled,
            styles: task.styles,
        });
    } catch (error) {
        res.status(500).json({
            message: "태스크 업데이트 중 오류가 발생했습니다.",
        });
    }
});

app.delete("/api/tasks/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const task = await ProjectTask.findOne({
            where: { id, company: req.user.company },
        });

        if (!task) {
            return res
                .status(404)
                .json({ message: "태스크를 찾을 수 없습니다." });
        }

        await task.destroy();
        res.json({ message: "태스크가 삭제되었습니다." });
    } catch (error) {
        res.status(500).json({
            message: "태스크 삭제 중 오류가 발생했습니다.",
        });
    }
});

app.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});
