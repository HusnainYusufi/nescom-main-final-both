// src/store.js
import { legacy_createStore as createStore } from 'redux'

const initialState = {
  sidebarShow: true,
  sidebarUnfoldable: false,
  theme: 'light',
  activeModule: 'dashboard',
  activeProjectId: null,
  projects: [],
  selection: {
    project: null,
    set: null,
    component: null,
    assembly: null,
    part: null,
  },
}

const changeState = (state = initialState, { type, ...rest }) => {
  switch (type) {
    case 'set':
      return { ...state, ...rest }
    case 'addProject': {
      const newProject = { ...rest.project, id: rest.project.id || rest.project._id }
      return {
        ...state,
        projects: [...state.projects, newProject],
        activeProjectId: newProject.id,
      }
    }
    case 'setActiveProject':
      return { ...state, activeProjectId: rest.projectId }
    case 'updateProject':
      return {
        ...state,
        projects: state.projects.map((project) =>
          project.id === rest.projectId ? { ...project, ...rest.changes } : project,
        ),
      }
    case 'updateSelection':
      return { ...state, selection: { ...state.selection, ...rest.selection } }
    default:
      return state
  }
}

const store = createStore(changeState)
export default store
