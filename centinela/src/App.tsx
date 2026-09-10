//import MainLayout from './components/layout/MainLayout';
import { TwoFactorPage } from './pages/TwoFactor';
import MainLayoutAuth from './components/layout_auth/MainLayoutAuth';
function App() {
  return (
    <>
      <MainLayoutAuth>
        <TwoFactorPage />
      </MainLayoutAuth>
    </>
    
  );
}

export default App;

/* <TwoFactorPage />
      <MainLayout>
        <div className="flex h-full items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-700 mb-2">  proximas pantallas</h2>
            <p className="text-gray-500">layout base conectado.</p>
          </div>
        </div>
      </MainLayout>*/