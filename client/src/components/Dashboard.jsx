import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';

const token = localStorage.getItem('token');
const socket = io('http://localhost:5005', {
  auth: { token }
});

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [newTask, setNewTask] = useState({ title: '', description: '', due_date: '', status: 'AVAILABLE' });
  
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchTasks();
    
    socket.on('taskCreated', (task) => {
      setTasks(prev => [...prev, task]);
    });
    socket.on('taskUpdated', (updatedTask) => {
      setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    });
    socket.on('taskDeleted', (taskId) => {
      setTasks(prev => prev.filter(t => t.id !== parseInt(taskId)));
    });

    return () => {
      socket.off('taskCreated');
      socket.off('taskUpdated');
      socket.off('taskDeleted');
    };
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await axios.get('http://localhost:5005/api/tasks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(res.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
    window.location.reload();
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5005/api/tasks', newTask, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsAdding(false);
      setNewTask({ title: '', description: '', due_date: '', status: 'AVAILABLE' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5005/api/tasks/${editingTask.id}`, editingTask, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditingTask(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await axios.delete(`http://localhost:5005/api/tasks/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusColors = (status) => {
    switch(status) {
      case 'IN PROGRESS': return { bg: 'var(--green-100)', text: 'var(--green-600)' };
      case 'PENDING REVIEW': return { bg: 'var(--orange-100)', text: 'var(--orange-600)' };
      case 'AVAILABLE': 
      default: return { bg: 'var(--blue-pill-bg)', text: 'var(--blue-text)' };
    }
  };

  const filteredTasks = tasks.filter(t => filterStatus === 'ALL' || t.status === filterStatus);
  
  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter(t => t.status !== 'IN PROGRESS').length; // Treating everything not in progress as pending/available
  const inProgressTasks = tasks.filter(t => t.status === 'IN PROGRESS').length;

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="logo">
          <i className="fa-solid fa-bolt"></i>
          <h2>TaskMaster</h2>
        </div>
        <nav className="nav-menu">
          <a href="#" className="nav-item active"><i className="fa-solid fa-border-all"></i> Dashboard</a>
          <button onClick={handleLogout} className="nav-item auth-submit-btn" style={{marginTop: 'auto', background: 'transparent', color: 'var(--red-text)', border: '1px solid var(--red-bg)', boxShadow: 'none'}}>
            <i className="fa-solid fa-sign-out"></i> Logout
          </button>
        </nav>
      </aside>

      <main className="main-content">
        <header className="top-header">
          <div className="header-text">
            <h1 className="page-title">Dashboard Overview</h1>
            <p className="page-subtitle">Track your tasks and productivity, {user?.username}!</p>
          </div>
          <div className="user-profile">
            <button onClick={() => setIsAdding(!isAdding)} className="auth-submit-btn" style={{width: 'auto', marginTop: 0}}>
              {isAdding ? 'Cancel' : '+ New Task'}
            </button>
            <div className="avatar" style={{background: 'var(--blue-heading)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white', fontSize: '20px'}}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
          </div>
        </header>
        
        {/* Statistics Section */}
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '40px' }}>
            <div className="card stat-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: 'var(--blue-text)' }}>
                    <i className="fa-solid fa-clipboard-list" style={{ fontSize: '24px' }}></i>
                    <h3 style={{ fontSize: '16px', color: 'var(--text-muted)', margin: 0 }}>Total Tasks</h3>
                </div>
                <h1 style={{ fontSize: '36px', color: 'var(--text-main)', margin: 0 }}>{totalTasks}</h1>
            </div>
            <div className="card stat-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: 'var(--orange-600)' }}>
                    <i className="fa-solid fa-clock" style={{ fontSize: '24px' }}></i>
                    <h3 style={{ fontSize: '16px', color: 'var(--text-muted)', margin: 0 }}>Pending / Available</h3>
                </div>
                <h1 style={{ fontSize: '36px', color: 'var(--text-main)', margin: 0 }}>{pendingTasks}</h1>
            </div>
            <div className="card stat-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: 'var(--green-600)' }}>
                    <i className="fa-solid fa-spinner" style={{ fontSize: '24px' }}></i>
                    <h3 style={{ fontSize: '16px', color: 'var(--text-muted)', margin: 0 }}>In Progress</h3>
                </div>
                <h1 style={{ fontSize: '36px', color: 'var(--text-main)', margin: 0 }}>{inProgressTasks}</h1>
            </div>
        </div>

        {/* Filter Section */}
        <div className="filter-container" style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            {['ALL', 'AVAILABLE', 'IN PROGRESS', 'PENDING REVIEW'].map(status => (
                <button 
                    key={status} 
                    onClick={() => setFilterStatus(status)}
                    style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '600',
                        backgroundColor: filterStatus === status ? 'var(--blue-btn)' : 'var(--card-bg)',
                        color: filterStatus === status ? 'white' : 'var(--text-muted)',
                        transition: 'all 0.2s'
                    }}
                >
                    {status}
                </button>
            ))}
        </div>

        {isAdding && (
          <div className="card mb-4" style={{animation: 'none'}}>
            <h2 className="section-title" style={{color: 'white', fontSize: '20px', marginBottom: '16px'}}>Create New Task</h2>
            <form onSubmit={handleCreateTask} className="auth-form">
              <input type="text" placeholder="Task Title" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} required />
              <textarea placeholder="Description" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} required rows="3" />
              <input type="text" placeholder="Due Date (e.g. 15 June 2026)" value={newTask.due_date} onChange={e => setNewTask({...newTask, due_date: e.target.value})} required />
              <select value={newTask.status} onChange={e => setNewTask({...newTask, status: e.target.value})}>
                <option value="AVAILABLE">Available</option>
                <option value="IN PROGRESS">In Progress</option>
                <option value="PENDING REVIEW">Pending Review</option>
              </select>
              <button type="submit" className="auth-submit-btn">Save Task</button>
            </form>
          </div>
        )}

        {/* Edit Modal (Inline for speed) */}
        {editingTask && (
          <div className="card mb-4" style={{animation: 'none', border: '1px solid var(--blue-heading)'}}>
            <h2 className="section-title" style={{color: 'white', fontSize: '20px', marginBottom: '16px'}}>Edit Task</h2>
            <form onSubmit={handleUpdateTask} className="auth-form">
              <input type="text" placeholder="Task Title" value={editingTask.title} onChange={e => setEditingTask({...editingTask, title: e.target.value})} required />
              <textarea placeholder="Description" value={editingTask.description} onChange={e => setEditingTask({...editingTask, description: e.target.value})} required rows="3" />
              <input type="text" placeholder="Due Date" value={editingTask.due_date} onChange={e => setEditingTask({...editingTask, due_date: e.target.value})} required />
              <select value={editingTask.status} onChange={e => setEditingTask({...editingTask, status: e.target.value})}>
                <option value="AVAILABLE">Available</option>
                <option value="IN PROGRESS">In Progress</option>
                <option value="PENDING REVIEW">Pending Review</option>
              </select>
              <div style={{display: 'flex', gap: '12px'}}>
                  <button type="submit" className="auth-submit-btn" style={{flex: 1}}>Update Task</button>
                  <button type="button" className="auth-submit-btn" onClick={() => setEditingTask(null)} style={{flex: 1, backgroundColor: 'transparent', border: '1px solid var(--border-color)', boxShadow: 'none'}}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="task-grid">
          {filteredTasks.length === 0 && !isAdding && (
            <div style={{gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)'}}>
                <i className="fa-solid fa-folder-open" style={{fontSize: '48px', marginBottom: '16px', opacity: 0.5}}></i>
                <p>No tasks found for this filter. Create one to get started!</p>
            </div>
          )}
          {filteredTasks.map((task, index) => {
            const colors = getStatusColors(task.status);
            return (
              <div className="card" key={task.id} style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="card-header">
                  <div className="badge-number" style={{backgroundColor: colors.bg, color: colors.text}}>{task.id}</div>
                  <div className="badge-status" style={{backgroundColor: colors.bg, color: colors.text}}>{task.status}</div>
                </div>
                <div className="date-info">
                  <i className="fa-regular fa-calendar"></i>
                  <span>Due Date: <span className="date-strong">{task.due_date}</span></span>
                </div>
                <hr className="divider" style={{marginTop: '12px'}} />
                <h1 className="title">{task.title}</h1>
                <p className="description">{task.description}</p>
                
                <div className="action-container" style={{gap: '12px', marginTop: 'auto'}}>
                  <button onClick={() => setEditingTask(task)} className="auth-submit-btn" style={{backgroundColor: colors.text, flex: 1, marginTop: 0, boxShadow: 'none'}}>Edit</button>
                  <button onClick={() => handleDeleteTask(task.id)} className="auth-submit-btn" style={{backgroundColor: 'var(--red-bg)', color: 'var(--red-text)', flex: '0 0 auto', width: 'auto', marginTop: 0, boxShadow: 'none'}}>
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
