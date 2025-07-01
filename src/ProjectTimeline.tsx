import { useState, useEffect } from "react";
import "gantt-task-react/dist/index.css";
import { Gantt, ViewMode } from "gantt-task-react";
import type { Task } from "gantt-task-react";
import "./ProjectTimeline.css";

const baseUrl: string = import.meta.env.VITE_HOST;

interface ProjectTimelineProps {
    token: string;
    user: {
        company: string;
        username: string;
    };
    onLogout: () => void;
}

// Define the interface for tasks received from the API
interface ApiTask {
    id: number; // Assuming ID from API is a number
    name: string;
    start: string; // ISO string date
    end: string; // ISO string date
    progress?: number;
    type?: string;
    isDisabled?: boolean;
    styles?: {
        progressColor?: string;
        progressSelectedColor?: string;
        backgroundColor?: string;
        backgroundSelectedColor?: string;
    };
}

export default function ProjectTimeline({
    token,
    user,
    onLogout,
}: ProjectTimelineProps) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [newTask, setNewTask] = useState({
        name: "",
        start: "",
        end: "",
        progress: 0,
    });

    // 기본 태스크 (빈 배열일 때 표시)
    const defaultTasks: Task[] = [
        {
            id: "default-1",
            name: "샘플 프로젝트",
            start: new Date("2025-01-01"),
            end: new Date("2025-12-31"),
            progress: 30,
            type: "task",
            isDisabled: false,
            styles: {
                progressColor: "#667eea",
                progressSelectedColor: "#667eea",
                backgroundColor: "#e5e7eb",
                backgroundSelectedColor: "#d1d5db",
            },
        },
    ];

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const response = await fetch(`${baseUrl}/api/tasks`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                console.log("받아온 데이터:", data);

                if (data && data.length > 0) {
                    const formattedTasks = data.map((task: ApiTask) => ({
                        id: task.id.toString(),
                        name: task.name,
                        start: new Date(task.start),
                        end: new Date(task.end),
                        progress: task.progress || 0,
                        type: task.type || "task",
                        isDisabled: task.isDisabled || false,
                        styles: task.styles || {
                            progressColor: "#667eea",
                            progressSelectedColor: "#667eea",
                            backgroundColor: "#e5e7eb",
                            backgroundSelectedColor: "#d1d5db",
                        },
                    }));
                    setTasks(formattedTasks);
                } else {
                    setTasks(defaultTasks);
                }
            } else {
                setTasks(defaultTasks);
            }
        } catch (error) {
            console.error("태스크를 가져오는 중 오류:", error);
            setTasks(defaultTasks);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch(`${baseUrl}/api/tasks`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...newTask,
                    type: "task",
                    isDisabled: false,
                    styles: {
                        progressColor: "#667eea",
                        progressSelectedColor: "#667eea",
                        backgroundColor: "#e5e7eb",
                        backgroundSelectedColor: "#d1d5db",
                    },
                }),
            });

            if (response.ok) {
                const task = await response.json();
                const formattedTask = {
                    id: task.id.toString(),
                    name: task.name,
                    start: new Date(task.start),
                    end: new Date(task.end),
                    progress: task.progress || 0,
                    type: task.type || "task",
                    isDisabled: task.isDisabled || false,
                    styles: task.styles || {
                        progressColor: "#667eea",
                        progressSelectedColor: "#667eea",
                        backgroundColor: "#e5e7eb",
                        backgroundSelectedColor: "#d1d5db",
                    },
                };

                const filteredTasks = tasks.filter(
                    (t) => !t.id.startsWith("default-")
                );
                setTasks([...filteredTasks, formattedTask]);
                setNewTask({ name: "", start: "", end: "", progress: 0 });
                setShowAddForm(false);
            }
        } catch (error) {
            console.error("태스크 추가 중 오류:", error);
        }
    };

    const handleEditTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTask) return;

        try {
            const response = await fetch(
                `${baseUrl}/api/tasks/${selectedTask.id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        name: selectedTask.name,
                        start: selectedTask.start.toISOString(),
                        end: selectedTask.end.toISOString(),
                        progress: selectedTask.progress,
                        type: selectedTask.type,
                        isDisabled: selectedTask.isDisabled,
                        styles: selectedTask.styles,
                    }),
                }
            );

            if (response.ok) {
                const updatedTask = await response.json();
                const formattedTask = {
                    id: updatedTask.id.toString(),
                    name: updatedTask.name,
                    start: new Date(updatedTask.start),
                    end: new Date(updatedTask.end),
                    progress: updatedTask.progress || 0,
                    type: updatedTask.type || "task",
                    isDisabled: updatedTask.isDisabled || false,
                    styles: updatedTask.styles || {
                        progressColor: "#667eea",
                        progressSelectedColor: "#667eea",
                        backgroundColor: "#e5e7eb",
                        backgroundSelectedColor: "#d1d5db",
                    },
                };

                setTasks(
                    tasks.map((t) =>
                        t.id === selectedTask.id ? formattedTask : t
                    )
                );
                setSelectedTask(null);
                setShowEditForm(false);
            }
        } catch (error) {
            console.error("태스크 수정 중 오류:", error);
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (taskId.startsWith("default-")) {
            return;
        }

        try {
            const response = await fetch(`${baseUrl}/api/tasks/${taskId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const remainingTasks = tasks.filter(
                    (task) => task.id !== taskId
                );
                if (remainingTasks.length === 0) {
                    setTasks(defaultTasks);
                } else {
                    setTasks(remainingTasks);
                }
            }
        } catch (error) {
            console.error("태스크 삭제 중 오류:", error);
        }
    };
    const handleTaskClick = (task: Task) => {
        if (task.id.startsWith("default-")) {
            alert("샘플 태스크는 편집할 수 없습니다.");
            return;
        }
        setSelectedTask(task);
        setShowEditForm(true);
    };

    if (loading) {
        return (
            <div className="timeline-container">
                <div className="loading">로딩 중...</div>
            </div>
        );
    }

    return (
        <div className="timeline-container">
            <div className="timeline-header">
                <div className="header-content">
                    <div>
                        <h1 className="timeline-title">{user.company}</h1>
                        <p className="timeline-subtitle">
                            안녕하세요, {user.username}님!
                        </p>
                    </div>
                    <div className="header-actions">
                        <button
                            className="add-task-button"
                            onClick={() => setShowAddForm(true)}
                        >
                            + 새 태스크
                        </button>
                        <button className="logout-button" onClick={onLogout}>
                            로그아웃
                        </button>
                    </div>
                </div>
            </div>

            {/* 태스크 목록 */}
            <div className="task-list">
                <h3>태스크 목록</h3>
                <div className="task-items">
                    {tasks.map((task) => (
                        <div key={task.id} className="task-item">
                            <div className="task-info">
                                <h4>{task.name}</h4>
                                <p>시작: {task.start.toLocaleDateString()}</p>
                                <p>종료: {task.end.toLocaleDateString()}</p>
                                <p>진행률: {task.progress}%</p>
                            </div>
                            <div className="task-actions">
                                {/* <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={task.progress}
                                    onChange={(e) =>
                                        handleProgressChange(
                                            task.id,
                                            parseInt(e.target.value)
                                        )
                                    }
                                    className="progress-slider"
                                /> */}
                                <button
                                    className="edit-button"
                                    onClick={() => handleTaskClick(task)}
                                >
                                    편집
                                </button>
                                <button
                                    className="delete-button"
                                    onClick={() => {
                                        if (task.id.startsWith("default-")) {
                                            alert(
                                                "샘플 태스크는 삭제할 수 없습니다."
                                            );
                                            return;
                                        }
                                        if (
                                            confirm(
                                                "이 태스크를 삭제하시겠습니까?"
                                            )
                                        ) {
                                            handleDeleteTask(task.id);
                                        }
                                    }}
                                >
                                    삭제
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 새 태스크 추가 모달 */}
            {showAddForm && (
                <div className="add-task-modal">
                    <div className="modal-content">
                        <h3>새 태스크 추가</h3>
                        <form onSubmit={handleAddTask}>
                            <div className="form-group">
                                <p>태스크 이름</p>
                                <input
                                    type="text"
                                    placeholder="태스크 이름"
                                    value={newTask.name}
                                    onChange={(e) =>
                                        setNewTask({
                                            ...newTask,
                                            name: e.target.value,
                                        })
                                    }
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <p>시작일</p>
                                <input
                                    type="date"
                                    value={newTask.start}
                                    onChange={(e) =>
                                        setNewTask({
                                            ...newTask,
                                            start: e.target.value,
                                        })
                                    }
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <p>종료일</p>
                                <input
                                    type="date"
                                    value={newTask.end}
                                    onChange={(e) =>
                                        setNewTask({
                                            ...newTask,
                                            end: e.target.value,
                                        })
                                    }
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <p>진행률</p>
                                <input
                                    type="number"
                                    placeholder="진행률 (0-100)"
                                    min="0"
                                    max="100"
                                    value={newTask.progress}
                                    onChange={(e) =>
                                        setNewTask({
                                            ...newTask,
                                            progress:
                                                parseInt(e.target.value) || 0,
                                        })
                                    }
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="submit-button">
                                    추가
                                </button>
                                <button
                                    type="button"
                                    className="cancel-button"
                                    onClick={() => setShowAddForm(false)}
                                >
                                    취소
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 태스크 편집 모달 */}
            {showEditForm && selectedTask && (
                <div className="add-task-modal">
                    <div className="modal-content">
                        <h3>태스크 편집</h3>
                        <form onSubmit={handleEditTask}>
                            <div className="form-group">
                                <p>태스크 이름</p>
                                <input
                                    type="text"
                                    placeholder="태스크 이름"
                                    value={selectedTask.name}
                                    onChange={(e) =>
                                        setSelectedTask({
                                            ...selectedTask,
                                            name: e.target.value,
                                        })
                                    }
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <p>시작일</p>
                                <input
                                    type="date"
                                    value={
                                        selectedTask.start
                                            .toISOString()
                                            .split("T")[0]
                                    }
                                    onChange={(e) =>
                                        setSelectedTask({
                                            ...selectedTask,
                                            start: new Date(e.target.value),
                                        })
                                    }
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <p>종료일</p>
                                <input
                                    type="date"
                                    value={
                                        selectedTask.end
                                            .toISOString()
                                            .split("T")[0]
                                    }
                                    onChange={(e) =>
                                        setSelectedTask({
                                            ...selectedTask,
                                            end: new Date(e.target.value),
                                        })
                                    }
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <p>진행률</p>
                                <input
                                    type="number"
                                    placeholder="진행률 (0-100)"
                                    min="0"
                                    max="100"
                                    value={selectedTask.progress}
                                    onChange={(e) =>
                                        setSelectedTask({
                                            ...selectedTask,
                                            progress:
                                                parseInt(e.target.value) || 0,
                                        })
                                    }
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="submit-button">
                                    저장
                                </button>
                                <button
                                    type="button"
                                    className="cancel-button"
                                    onClick={() => {
                                        setSelectedTask(null);
                                        setShowEditForm(false);
                                    }}
                                >
                                    취소
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="gantt-container">
                <Gantt
                    tasks={tasks}
                    viewMode={ViewMode.Month}
                    onDoubleClick={(task) => {
                        if (task.id.startsWith("default-")) {
                            alert("샘플 태스크는 삭제할 수 없습니다.");
                            return;
                        }
                        handleTaskClick(task);
                    }}
                />
            </div>
        </div>
    );
}
