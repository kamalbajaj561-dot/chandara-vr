import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createEvent } from '../services/eventService';
import { validateEventForm } from '../utils/validators';
import { Upload, Calendar, MapPin, Camera, DollarSign, Check } from 'lucide-react';

const CreateEvent = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sport: '',
    country: '',
    city: '',
    date: '',
    time: '',
    ticketPrice: '',
    cameraType: ''
  });
  const [thumbnail, setThumbnail] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [streamInfo, setStreamInfo] = useState(null);

  const sports = [
    'Football', 'Cricket', 'Basketball', 'Volleyball', 'Tennis',
    'Baseball', 'Rugby', 'Hockey', 'Esports', 'MMA', 'Boxing',
    'Golf', 'Athletics', 'Swimming', 'Other'
  ];

  const countries = [
    'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
    'France', 'Spain', 'Italy', 'Brazil', 'India', 'Japan', 'South Korea',
    'Mexico', 'Argentina', 'South Africa', 'Nigeria', 'Egypt', 'Other'
  ];

  const cameraTypes = [
    { value: 'mobile', label: 'Mobile Camera', description: 'Standard mobile camera streaming' },
    { value: '180vr', label: '180 VR Camera', description: 'Immersive 180-degree VR experience' },
    { value: '360vr', label: '360 VR Camera', description: 'Full 360-degree VR experience' }
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnail(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validation = validateEventForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    
    const eventData = {
      title: formData.title,
      description: formData.description,
      sport: formData.sport,
      country: formData.country,
      city: formData.city,
      date: formData.date,
      time: formData.time,
      ticketPrice: parseFloat(formData.ticketPrice),
      cameraType: formData.cameraType,
      ownerId: user.uid
    };

    const result = await createEvent(eventData, thumbnail);
    
    if (result.success) {
      setStreamInfo({
        streamKey: result.streamKey,
        streamUrl: result.streamUrl
      });
    } else {
      setErrors({ general: result.error });
    }
    
    setLoading(false);
  };

  if (streamInfo) {
    return (
      <div className="min-h-screen bg-darkerBlue py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="card text-center">
            <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Event Created Successfully!</h1>
            <p className="text-gray-400 mb-8">Your event has been submitted for approval. Use the following details to start streaming:</p>
            
            <div className="bg-darkerBlue rounded-lg p-6 mb-6">
              <div className="mb-4">
                <label className="block text-gray-400 text-sm mb-2">Stream URL</label>
                <div className="bg-black border border-gray-700 rounded-lg px-4 py-3 text-gold font-mono">
                  {streamInfo.streamUrl}
                </div>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Stream Key</label>
                <div className="bg-black border border-gray-700 rounded-lg px-4 py-3 text-gold font-mono">
                  {streamInfo.streamKey}
                </div>
              </div>
            </div>

            <div className="bg-yellow-600/20 border border-yellow-600 rounded-lg p-4 mb-6">
              <p className="text-yellow-400 text-sm">
                <strong>Important:</strong> Keep your stream key secure. Do not share it with anyone. 
                Your event will be visible once approved by an admin.
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/streamer-dashboard')}
                className="btn-primary"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => window.location.reload()}
                className="btn-secondary"
              >
                Create Another Event
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-darkerBlue py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">Create New Event</h1>
        
        <div className="card">
          {errors.general && (
            <div className="bg-red-600/20 border border-red-600 text-red-400 px-4 py-3 rounded-lg mb-6">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-300 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Event Name
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`input-field ${errors.title ? 'border-red-500' : ''}`}
                placeholder="Enter event name"
              />
              {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className={`input-field ${errors.description ? 'border-red-500' : ''}`}
                rows="4"
                placeholder="Describe your event"
              />
              {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Sport Type</label>
              <select
                name="sport"
                value={formData.sport}
                onChange={handleChange}
                className={`input-field ${errors.sport ? 'border-red-500' : ''}`}
              >
                <option value="">Select sport</option>
                {sports.map(sport => (
                  <option key={sport} value={sport}>{sport}</option>
                ))}
              </select>
              {errors.sport && <p className="text-red-400 text-sm mt-1">{errors.sport}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Country
                </label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className={`input-field ${errors.country ? 'border-red-500' : ''}`}
                >
                  <option value="">Select country</option>
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
                {errors.country && <p className="text-red-400 text-sm mt-1">{errors.country}</p>}
              </div>

              <div>
                <label className="block text-gray-300 mb-2">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className={`input-field ${errors.city ? 'border-red-500' : ''}`}
                  placeholder="City"
                />
                {errors.city && <p className="text-red-400 text-sm mt-1">{errors.city}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className={`input-field ${errors.date ? 'border-red-500' : ''}`}
                />
                {errors.date && <p className="text-red-400 text-sm mt-1">{errors.date}</p>}
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Time</label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className={`input-field ${errors.time ? 'border-red-500' : ''}`}
                />
                {errors.time && <p className="text-red-400 text-sm mt-1">{errors.time}</p>}
              </div>
            </div>

            <div>
              <label className="block text-gray-300 mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Ticket Price (USD)
              </label>
              <input
                type="number"
                name="ticketPrice"
                value={formData.ticketPrice}
                onChange={handleChange}
                step="0.01"
                min="0"
                className={`input-field ${errors.ticketPrice ? 'border-red-500' : ''}`}
                placeholder="0.00"
              />
              {errors.ticketPrice && <p className="text-red-400 text-sm mt-1">{errors.ticketPrice}</p>}
            </div>

            <div>
              <label className="block text-gray-300 mb-2 flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Camera Type
              </label>
              <div className="space-y-3">
                {cameraTypes.map(type => (
                  <label
                    key={type.value}
                    className={`block p-4 border rounded-lg cursor-pointer transition-all ${
                      formData.cameraType === type.value
                        ? 'border-gold bg-gold/10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cameraType"
                      value={type.value}
                      checked={formData.cameraType === type.value}
                      onChange={handleChange}
                      className="mr-3"
                    />
                    <div>
                      <span className="font-semibold text-white">{type.label}</span>
                      <p className="text-gray-400 text-sm">{type.description}</p>
                    </div>
                  </label>
                ))}
              </div>
              {errors.cameraType && <p className="text-red-400 text-sm mt-1">{errors.cameraType}</p>}
            </div>

            <div>
              <label className="block text-gray-300 mb-2 flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Thumbnail (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                className="input-field"
              />
              {thumbnail && (
                <p className="text-gray-400 text-sm mt-2">Selected: {thumbnail.name}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Event...' : 'Create Event'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;
