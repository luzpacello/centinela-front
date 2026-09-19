import { RouterProvider } from 'react-router/dom';
import { ApiResponseNotifier } from './components/common/ApiResponseNotifier';
import { Toaster } from './components/ui/toast';
import { applicationRouter } from './routes/router';

function App() {
  return (
    <Toaster>
      <ApiResponseNotifier />
      <RouterProvider router={applicationRouter} />
    </Toaster>
  );
}

export default App;
