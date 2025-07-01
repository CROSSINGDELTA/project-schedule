import { useState, useEffect } from "react";
import ProjectTimeline from "./ProjectTimeline";
import Login from "./Login";
import "./App.css";

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [token, setToken] = useState("");
    const [user, setUser] = useState(null);

    useEffect(() => {
        // 로컬 스토리지에서 토큰 확인
        const savedToken = localStorage.getItem("token");
        const savedUser = localStorage.getItem("user");

        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
            setIsLoggedIn(true);
        }
    }, []);

    const handleLogin = (newToken: string, userData: any) => {
        setToken(newToken);
        setUser(userData);
        setIsLoggedIn(true);

        // 로컬 스토리지에 저장
        localStorage.setItem("token", newToken);
        localStorage.setItem("user", JSON.stringify(userData));
    };

    const handleLogout = () => {
        setToken("");
        setUser(null);
        setIsLoggedIn(false);

        // 로컬 스토리지에서 제거
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    };

    return (
        <div className="App">
            {isLoggedIn ? (
                <ProjectTimeline
                    token={token}
                    user={user}
                    onLogout={handleLogout}
                />
            ) : (
                <Login onLogin={handleLogin} />
            )}
            <div className="crossingdelta-logo">
                <a
                    href="https://crossingdelta.com"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <img src="/-2.png" alt="CrossingDelta Logo" />
                </a>
            </div>
        </div>
    );
}

export default App;
