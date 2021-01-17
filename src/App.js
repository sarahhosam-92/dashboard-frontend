import './App.css';
import TableEditable from './TableEditable';
import Amplify from 'aws-amplify'
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react'
import awsExports from "./aws-exports";
Amplify.configure(awsExports);
function App() {
  return (
    <div>
      <TableEditable/>
    </div>
  );
}

export default withAuthenticator(App);
