import { RouterProvider } from 'react-router/dom';
import { ApiResponseNotifier } from './components/common/ApiResponseNotifier';
import { Toaster } from './components/ui/toast';
import { applicationRouter } from './routes/router';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <Toaster>
      <AuthProvider>
        <ApiResponseNotifier />
        <RouterProvider router={applicationRouter} />
      </AuthProvider>
    </Toaster>
  );
}

export default App;
