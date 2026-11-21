import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Users, Calendar, Star, ArrowRight, CheckCircle } from 'lucide-react';
import { getEvents } from '../services/eventService';
import { formatCurrency, formatDateTime } from '../utils/formatDate';
import Footer from '../components/Footer';

const Home = () => {
  const [liveEvents, setLiveEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [topStreamers, setTopStreamers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const liveResult = await getEvents({ status: 'live', limit: 4 });
      if (liveResult.success) {
        setLiveEvents(liveResult.events);
      }

      const upcomingResult = await getEvents({ status: 'approved', limit: 4 });
      if (upcomingResult.success) {
        setUpcomingEvents(upcomingResult.events);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading events:', error);
      setLoading(false);
    }
  };

  const howItWorksSteps = [
    {
      icon: <Users className="w-8 h-8 text-gold" />,
      title: 'Create Account',
      description: 'Sign up as a viewer or streamer in seconds'
    },
    {
      icon: <Calendar className="w-8 h-8 text-gold" />,
      title: 'Browse Events',
      description: 'Find live and upcoming sports events worldwide'
    },
    {
      icon: <CheckCircle className="w-8 h-8 text-gold" />,
      title: 'Buy Tickets',
      description: 'Purchase tickets to access exclusive VR streams'
    },
    {
      icon: <Play className="w-8 h-8 text-gold" />,
      title: 'Watch in VR',
      description: 'Experience immersive 360° VR viewing'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-darkBlue via-darkerBlue to-black py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-gold to-goldLight bg-clip-text text-transparent">
            Watch Live Sports In VR
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Experience sports like never before with immersive 360° virtual reality streaming from anywhere in the world
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/events" className="btn-primary text-lg">
              Browse Events
            </Link>
            <Link to="/become-streamer" className="btn-secondary text-lg">
              Become A Streamer
            </Link>
          </div>
        </div>
      </section>

      {/* Live Events Section */}
      <section className="py-16 px-4 bg-darkerBlue">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-white">Live Events</h2>
            <Link to="/events?status=live" className="text-gold hover:text-goldLight flex items-center gap-2">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {loading ? (
            <div className="text-center text-gray-400">Loading events...</div>
          ) : liveEvents.length === 0 ? (
            <div className="text-center text-gray-400 py-12">No live events at the moment</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {liveEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="py-16 px-4 bg-darkBlue">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-white">Upcoming Events</h2>
            <Link to="/events" className="text-gold hover:text-goldLight flex items-center gap-2">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {loading ? (
            <div className="text-center text-gray-400">Loading events...</div>
          ) : upcomingEvents.length === 0 ? (
            <div className="text-center text-gray-400 py-12">No upcoming events</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {upcomingEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Top Streamers Section */}
      <section className="py-16 px-4 bg-darkerBlue">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Top Streamers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'SportsVR Pro', events: 45, followers: '12.5K' },
              { name: 'LiveSports HD', events: 38, followers: '9.8K' },
              { name: 'VR Athletics', events: 32, followers: '8.2K' }
            ].map((streamer, index) => (
              <div key={index} className="card flex items-center gap-4">
                <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center text-black font-bold text-xl">
                  {streamer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{streamer.name}</h3>
                  <p className="text-gray-400 text-sm">{streamer.events} events • {streamer.followers} followers</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4 bg-darkBlue">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorksSteps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-20 h-20 bg-darkBlue border-2 border-gold rounded-full flex items-center justify-center mx-auto mb-4">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-gray-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

const EventCard = ({ event }) => {
  return (
    <Link to={`/event/${event.id}`} className="block group">
      <div className="card overflow-hidden group-hover:border-gold transition-all">
        {event.thumbnail ? (
          <img 
            src={event.thumbnail} 
            alt={event.title} 
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-darkBlue to-darkerBlue flex items-center justify-center">
            <Play className="w-12 h-12 text-gold" />
          </div>
        )}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs bg-gold text-black px-2 py-1 rounded font-semibold">
              {event.sport}
            </span>
            {event.status === 'live' && (
              <span className="text-xs bg-red-600 text-white px-2 py-1 rounded font-semibold flex items-center gap-1">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                LIVE
              </span>
            )}
          </div>
          <h3 className="font-semibold text-white mb-2 truncate">{event.title}</h3>
          <p className="text-gray-400 text-sm mb-2">{event.city}, {event.country}</p>
          <div className="flex justify-between items-center">
            <span className="text-gold font-semibold">{formatCurrency(event.ticketPrice)}</span>
            <span className="text-gray-400 text-sm">{formatDateTime(event.date)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default Home;
