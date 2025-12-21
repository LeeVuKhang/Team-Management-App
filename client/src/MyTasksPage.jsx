import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Calendar, Clock, AlertCircle, CheckCircle2, Circle, Loader2 } from 'lucide-react';

/**
 * TASK CARD COMPONENT
 */
const TaskCard = ({ task, darkMode, onClick }) => {
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'text-red-500 bg-red-500/10';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10';
      case 'low': return 'text-blue-500 bg-blue-500/10';
      default: return darkMode ? 'text-gray-400 bg-gray-700' : 'text-gray-600 bg-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'done': return <CheckCircle2 size={16} className="text-green-500" />;
      case 'in_progress': return <Clock size={16} className="text-blue-500" />;
      default: return <Circle size={16} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />;
    }
  };

  return (
    <div
      onClick={() => onClick?.(task)}
      className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${
        darkMode 
          ? 'bg-dark-secondary border-[#171717] hover:border-gray-700' 
          : 'bg-white border-gray-200 hover:border-gray-400'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{getStatusIcon(task.status)}</div>
        
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {task.title}
          </h3>
          
          {task.description && (
            <p className={`text-sm mb-2 line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-3 text-xs">
            {/* Priority Badge */}
            <span className={`px-2 py-1 rounded-full font-medium ${getPriorityColor(task.priority)}`}>
              {task.priority || 'None'}
            </span>

            {/* Due Date */}
            {task.due_date && (
              <div className={`flex items-center gap-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <Calendar size={12} />
                <span>{new Date(task.due_date).toLocaleDateString()}</span>
              </div>
            )}

            {/* Project Name */}
            {task.project_name && (
              <span className={`${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                {task.project_name}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * MAIN MY TASKS PAGE
 */
export default function MyTasksPage() {
  const { isDarkMode } = useOutletContext();
  const [tasks, setTasks] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Mock data for now - will replace with API call later
  React.useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setTasks([
        // Overdue tasks
        {
          id: 1,
          title: 'Fix authentication bug',
          description: 'Users unable to login with social accounts',
          status: 'in_progress',
          priority: 'high',
          due_date: '2025-12-18',
          project_name: 'Backend API',
        },
        {
          id: 2,
          title: 'Update API documentation',
          description: 'Add examples for new endpoints',
          status: 'todo',
          priority: 'medium',
          due_date: '2025-12-19',
          project_name: 'Documentation',
        },
        // Today's tasks
        {
          id: 3,
          title: 'Review pull requests',
          description: 'Check team members PRs before merging',
          status: 'in_progress',
          priority: 'high',
          due_date: '2025-12-21',
          project_name: 'Code Review',
        },
        {
          id: 4,
          title: 'Write unit tests',
          description: 'Add tests for user authentication flow',
          status: 'todo',
          priority: 'medium',
          due_date: '2025-12-21',
          project_name: 'Testing',
        },
        // Upcoming tasks
        {
          id: 5,
          title: 'Implement dark mode',
          description: 'Add dark mode support to all pages',
          status: 'todo',
          priority: 'low',
          due_date: '2025-12-25',
          project_name: 'Frontend',
        },
        {
          id: 6,
          title: 'Database optimization',
          description: 'Optimize slow queries and add indexes',
          status: 'todo',
          priority: 'medium',
          due_date: '2025-12-28',
          project_name: 'Backend API',
        },
      ]);
      setIsLoading(false);
    }, 1000);
  }, []);

  // Group tasks by date
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueTasks = tasks.filter(task => {
    if (!task.due_date) return false;
    const dueDate = new Date(task.due_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today && task.status !== 'done';
  });

  const todayTasks = tasks.filter(task => {
    if (!task.due_date) return false;
    const dueDate = new Date(task.due_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate.getTime() === today.getTime();
  });

  const upcomingTasks = tasks.filter(task => {
    if (!task.due_date) return false;
    const dueDate = new Date(task.due_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate > today;
  });

  const noDateTasks = tasks.filter(task => !task.due_date);

  const handleTaskClick = (task) => {
    console.log('Task clicked:', task);
    // TODO: Navigate to project page or open task modal
  };

  return (
    <div className="w-full min-h-full flex flex-col max-w-[1200px] mx-auto px-4 lg:px-6 xl:px-10">
      
      {/* Header */}
      <div className="pt-12 pb-6">
        <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
          My Tasks
        </h1>
        <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          All tasks assigned to you across all projects
        </p>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className={`w-8 h-8 animate-spin ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
        </div>
      ) : (
        <div className="pb-12 space-y-8">
          
          {/* Overdue Tasks */}
          {overdueTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle size={20} className="text-red-500" />
                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Overdue
                </h2>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-500/10 text-red-500">
                  {overdueTasks.length}
                </span>
              </div>
              <div className="space-y-3">
                {overdueTasks.map(task => (
                  <TaskCard key={task.id} task={task} darkMode={isDarkMode} onClick={handleTaskClick} />
                ))}
              </div>
            </div>
          )}

          {/* Today's Tasks */}
          {todayTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Clock size={20} className="text-green-500" />
                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Today
                </h2>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-500/10 text-green-500">
                  {todayTasks.length}
                </span>
              </div>
              <div className="space-y-3">
                {todayTasks.map(task => (
                  <TaskCard key={task.id} task={task} darkMode={isDarkMode} onClick={handleTaskClick} />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Tasks */}
          {upcomingTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={20} className="text-blue-500" />
                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Upcoming
                </h2>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-500/10 text-blue-500">
                  {upcomingTasks.length}
                </span>
              </div>
              <div className="space-y-3">
                {upcomingTasks.map(task => (
                  <TaskCard key={task.id} task={task} darkMode={isDarkMode} onClick={handleTaskClick} />
                ))}
              </div>
            </div>
          )}

          {/* No Due Date Tasks */}
          {noDateTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Circle size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  No Due Date
                </h2>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                }`}>
                  {noDateTasks.length}
                </span>
              </div>
              <div className="space-y-3">
                {noDateTasks.map(task => (
                  <TaskCard key={task.id} task={task} darkMode={isDarkMode} onClick={handleTaskClick} />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {tasks.length === 0 && (
            <div className={`text-center py-20 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <CheckCircle2 size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No tasks assigned</p>
              <p className="text-sm">You're all caught up! 🎉</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
