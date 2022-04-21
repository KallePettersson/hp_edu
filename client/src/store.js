import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import rootReducer from './reducers';

const initialState = localStorage.getItem('exerciseState') 
                        ? {exercise: JSON.parse(localStorage.getItem('exerciseState'))}
                        : {};

const middleware = [thunk];

const store = createStore(
        rootReducer,
        initialState,
        // applyMiddleware(...middleware),
        // Redux dev tools seems to not work on chromium based browsers...
        compose(
            applyMiddleware(...middleware) //,
            //window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
        )
    );

export default store;