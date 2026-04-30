import Layout from './components/layout/Layout';
import DashboardPage from './pages/DashboardPage';
import { CURRENT_USER } from './constants/dashboard';

const App = () => (
  <Layout user={CURRENT_USER}>
    <DashboardPage />
  </Layout>
);

export default App;