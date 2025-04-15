import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { useAuthenticator } from '@aws-amplify/ui-react';
import { uploadData } from 'aws-amplify/storage';
import CameraCapture from './components/CameraCapture';
import './App.css';

const client = generateClient<Schema>();

function App() {
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const { signOut } = useAuthenticator();
  
  useEffect(() => {
    client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
    });
  }, []);

  function createTodo() {
    client.models.Todo.create({ content: window.prompt("Todo content") });
  }
  
  function deleteTodo(id: string) {
    client.models.Todo.delete({ id });
  }

  const handleImageSend = async (imageData: string) => {
    try {
      setUploadStatus('Uploading...');
      
      // Convert the base64 data URL to a blob for upload
      const base64Response = await fetch(imageData);
      const blob = await base64Response.blob();
      
      // Create a unique filename using timestamp
      const fileName = `image_${Date.now()}.jpg`;
      
      // Upload to Amplify Storage
      const result = await uploadData({
        key: fileName,
        data: blob,
        options: {
          contentType: 'image/jpeg',
          // Optional metadata
          metadata: {
            uploadedAt: new Date().toISOString(),
          }
        }
      }).result;
      
      console.log('Upload successful:', result);
      setUploadStatus('Upload successful! File saved as: ' + fileName);
      
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadStatus(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="app">
      <main>
        <h1>My todos</h1>
        <button onClick={createTodo}>+ new</button>
        <ul>
          {todos.map((todo) => (
            <li
            onClick={() => deleteTodo(todo.id)}
            key={todo.id}>
            {todo.content}
          </li>
          ))}
        </ul>
        <div>
          🥳 App successfully hosted. Try creating a new todo.
          <br />
          <a href="https://docs.amplify.aws/react/start/quickstart/#make-frontend-updates">
            Review next step of this tutorial.
          </a>
        </div>
        <button onClick={signOut}>Sign out</button>
      </main>
      
      <h2>Camera Capture</h2>
      <CameraCapture onImageSend={handleImageSend} />
      
      {uploadStatus && (
        <div className={uploadStatus.includes('failed') ? 'upload-error' : 'upload-success'}>
          {uploadStatus}
        </div>
      )}
    </div>
  );
}

export default App;
