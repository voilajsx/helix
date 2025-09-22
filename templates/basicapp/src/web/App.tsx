/**
 * Main App Component - FBCA Architecture
 * Feature-Based Component Architecture with auto-discovery routing
 */

import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from '@voilajsx/uikit/theme-provider';
import { PageRouter } from './lib/page-router';

function App() {
  return (
    <ThemeProvider theme="base" mode="light" forceConfig={true}>
      <Router basename="/">
        <PageRouter />
      </Router>
    </ThemeProvider>
  );
}

export default App;