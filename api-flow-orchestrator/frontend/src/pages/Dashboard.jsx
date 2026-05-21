import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Play, Edit, Trash2, Search } from 'lucide-react';
import { apiGroupService } from '../services/api';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');

  const { data: groups, isLoading } = useQuery({
    queryKey: ['apiGroups'],
    queryFn: async () => {
      const response = await apiGroupService.getAll();
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => apiGroupService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['apiGroups']);
      setShowCreateModal(false);
      setNewGroupName('');
      setNewGroupDescription('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiGroupService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['apiGroups']);
    },
  });

  const handleCreateGroup = (e) => {
    e.preventDefault();
    createMutation.mutate({
      name: newGroupName,
      description: newGroupDescription,
    });
  };

  const handleDeleteGroup = (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const filteredGroups = groups?.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>API Groups</h2>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={18} />
          Create New Group
        </button>
      </div>

      <div className="search-bar">
        <Search size={20} />
        <input
          type="text"
          placeholder="Search API groups..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input"
        />
      </div>

      <div className="groups-grid">
        {filteredGroups?.length === 0 ? (
          <div className="empty-state">
            <p>No API groups found. Create your first group to get started!</p>
          </div>
        ) : (
          filteredGroups?.map((group) => (
            <div key={group.id} className="group-card card">
              <div className="group-card-header">
                <h3>{group.name}</h3>
                <div className="group-card-actions">
                  <button
                    className="icon-btn"
                    onClick={() => navigate(`/groups/${group.id}`)}
                    title="Edit"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    className="icon-btn danger"
                    onClick={() => handleDeleteGroup(group.id, group.name)}
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <p className="group-description">{group.description || 'No description'}</p>
              <div className="group-card-footer">
                <span className="group-stat">
                  {group.apiNodes?.length || 0} API{group.apiNodes?.length !== 1 ? 's' : ''}
                </span>
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => navigate(`/groups/${group.id}`)}
                >
                  <Play size={16} />
                  Open
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Create New API Group</h3>
            <form onSubmit={handleCreateGroup}>
              <div className="form-group">
                <label className="label">Group Name *</label>
                <input
                  type="text"
                  className="input"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  required
                  placeholder="e.g., User Onboarding Flow"
                />
              </div>
              <div className="form-group">
                <label className="label">Description</label>
                <textarea
                  className="textarea"
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="Describe the purpose of this API group..."
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;

// Made with Bob
