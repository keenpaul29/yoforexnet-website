import CreateThreadButton from '../CreateThreadButton';

export default function CreateThreadButtonExample() {
  return (
    <div className="p-8">
      <CreateThreadButton onCreateThread={(thread) => console.log('Thread created:', thread)} />
    </div>
  );
}
