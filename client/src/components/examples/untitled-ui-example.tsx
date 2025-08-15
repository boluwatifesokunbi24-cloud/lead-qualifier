import { 
  User01,
  Settings01,
  Download01,
  Upload01,
  CheckCircle,
  AlertTriangle,
  Plus
} from '@untitledui/icons';

export function UntitledUIExample() {
  return (
    <div className="space-y-4 p-6">
      <h3 className="text-lg font-semibold">Untitled UI Icons Examples</h3>
      
      <div className="flex items-center space-x-4 text-gray-600">
        <User01 className="w-6 h-6" />
        <Settings01 className="w-6 h-6" />
        <Download01 className="w-6 h-6" />
        <Upload01 className="w-6 h-6" />
        <CheckCircle className="w-6 h-6 text-green-600" />
        <AlertTriangle className="w-6 h-6 text-yellow-600" />
        <Plus className="w-6 h-6 text-blue-600" />
      </div>

      <div className="flex space-x-2">
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          <span>Add Item</span>
        </button>
        
        <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          <Download01 className="w-4 h-4" />
          <span>Export</span>
        </button>
      </div>
    </div>
  );
}