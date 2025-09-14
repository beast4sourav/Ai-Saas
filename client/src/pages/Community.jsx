import React, { useEffect, useState } from 'react'
import { useUser, useAuth } from '@clerk/clerk-react'
import { Heart } from 'lucide-react';
import axios from 'axios';

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const Community = () => {

  const [creations, setCreations] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useUser();
  const { getToken } = useAuth();

  const fetchCreations = async () => {
    try {
      setLoading(true);
      console.log('Fetching published creations...');
      
      const { data } = await axios.get(
        "/api/user/get-published-creations",
        {
          headers: { Authorization: `Bearer ${await getToken()}` },
        }
      );
      
      if (data.success) {
        setCreations(data.creations);
        console.log('Published creations loaded:', data.creations.length);
      } else {
        console.error('Failed to fetch creations:', data.message);
        setCreations([]);
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      setCreations([]);
    } finally {
      setLoading(false);
    }
  }

  // Expose refresh function globally for other components to use
  useEffect(() => {
    window.refreshCommunity = fetchCreations;
    return () => {
      delete window.refreshCommunity;
    };
  }, []);

  const handleLike = async (creationId) => {
    if (!user?.id) {
      console.log('User not authenticated');
      return;
    }

    try {
      console.log('Toggling like for:', creationId);
      
      const { data } = await axios.post(
        "/api/user/get-like-creation",
        { id: creationId },
        {
          headers: { Authorization: `Bearer ${await getToken()}` },
        }
      );

      if (data.success) {
        // Update local state with the new likes from the server
        setCreations(prevCreations => 
          prevCreations.map(creation => {
            if (creation._id === creationId || creation.id === creationId) {
              return {
                ...creation,
                likes: data.likes || []
              };
            }
            return creation;
          })
        );
        console.log('Like toggled successfully:', data.message);
      } else {
        console.error('Failed to toggle like:', data.message);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  }

  useEffect(() => {
    console.log('Community component mounted');
    console.log('User:', user);
    if (user) {
      console.log('User found, fetching creations...');
      fetchCreations()
    } else {
      console.log('No user found');
    }
  }, [user])
  
  return (
    <div className='flex-1 h-full flex flex-col gap-4 p-6'>
      <h1 className='text-2xl font-semibold text-gray-800'>Community Creations</h1>
      <div className='bg-white h-full w-full rounded-xl overflow-scroll'>
        {console.log('Rendering Community - loading:', loading, 'creations:', creations.length)}
        {loading ? (
          <div className='flex justify-center items-center h-full'>
            <div className='text-gray-400'>Loading creations...</div>
          </div>
        ) : creations.length === 0 ? (
          <div className='flex justify-center items-center h-full'>
            <div className='text-gray-400 text-center'>
              <p>No published creations yet</p>
              <p className='text-sm mt-2'>Be the first to publish a creation!</p>
            </div>
          </div>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4'>
            {creations.map((creation, index) => {
              console.log('Rendering creation:', creation);
              const imageUrl = creation.secure_url || creation.content;
              const creationId = creation._id || creation.id || index;
              
              return (
                <div key={creationId} className='relative group'>
                  <img 
                    src={imageUrl} 
                    alt={creation.prompt || 'Creation'} 
                    className='w-full h-64 object-cover rounded-lg'
                    onError={(e) => {
                      console.error('Image failed to load:', imageUrl);
                      e.target.style.display = 'none';
                    }}
                  />

                  <div className='absolute bottom-0 top-0 right-0 left-0 flex gap-2
                  items-end justify-end group-hover:justify-between p-3
                  group-hover:bg-gradient-to-b from-transparent to-black/80 text-white'>
                    <p className='text-sm hidden group-hover:block'>{creation.prompt}</p>
                    <div className='flex gap-1 items-center'>
                      <p>{creation.likes?.length || 0}</p>
                      <Heart 
                        className={`min-w-5 h-5 hover:scale-110 cursor-pointer ${
                          creation.likes?.includes(user?.id) 
                            ? 'fill-red-500 text-red-600'
                            : 'text-white'
                        }`}
                        onClick={() => handleLike(creationId)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )
}
export default Community 
