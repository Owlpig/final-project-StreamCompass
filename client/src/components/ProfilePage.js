import React, { useState, useEffect } from 'react';
import { useOktaAuth } from '@okta/okta-react';
import { Redirect, Link } from 'react-router-dom';

const ProfilePage = () => {
  const { oktaAuth, authState } = useOktaAuth();
  const [user, setUser] = useState();
  const [favourites, setFavourites] = useState();
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState([]);

  const getCurrentUser = () => {
    oktaAuth.getUser()
      .then(currentUser => setUser(currentUser))
      .catch(err => setError(err.message));
  };

  const getFavourites = async method => {
    const rawData = await fetch('/api/mongodb/favourites/', {
      method,
      headers: { authorization: `Bearer ${authState.accessToken.accessToken}` },
    });
    if (rawData.status === 404) {
      return false;
    }
    const parsedData = await rawData.json();
    setFavourites(parsedData);
    return true;
  };

  const getReviews = () => {
    fetch(`/api/mongodb/reviews/${user.sub}`, {
      headers: { authorization: `Bearer ${authState.accessToken.accessToken}` },
    })
      .then(res => res.json())
      .then(data => setReviews(data));
  };

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(async () => {
    if (user) {
      await getReviews();
    }
    try {
      const successfull = authState.accessToken ? await getFavourites('GET') : null;
      if (!successfull) {
        throw new Error('No favourites array found');
      }
      return true;
    } catch (err) {
      const successfull = authState.accessToken ? await getFavourites('POST') : null;
      return successfull;
    }
  }, [user]);

  const handleFavourites = async series => {
    await fetch('/api/mongodb/favourites', {
      method: 'PUT',
      body: JSON.stringify({
        deleteFavourite: {
          imdbId: series.imdbId,
          name: series.name,
        },
      }),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        authorization: `Bearer ${authState.accessToken.accessToken}`,
      },
    });
    await getFavourites('GET');
  };

  if (!user) {
    if (!authState.accessToken) {
      return <p>Loading...</p>;
    }
    if (!authState.isAuthenticated) {
      return <Redirect to={{ pathname: '/login' }}/>;
    }
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <>
      <nav className='links'>
        <Link to='/login'><button className="logout-link" onClick={() => { oktaAuth.signOut(); }}>Logout</button></Link>
      </nav>
      <section className='user-profile'>
        <h1>User Profile</h1>
          <p>Welcome {user.name}!</p>
        <div className='user-content'>
          <section className='favourites-container'>
            <h3>Your favourite series:</h3>
            {favourites && favourites.length > 0 && favourites.map(series => <p key={series.imdbId}>
              <Link className='favourite-link' to={`/tvShow-details/${series.imdbId}`}>{series.name}</Link>
              <button className='remove-favourite-btn' onClick={() => handleFavourites(series)}>Remove</button>
            </p>)
            }
          </section>
          <section className='user-reviews-container'>
            <h3>Your reviews:</h3>
              <div className='user-reviews'>
                {reviews.map(review => <p key={review._id}>
                  <Link className='review-link' to={`/tvShow-details/${review.imdbId}`}>{review.title}
                    <span> ({review.mediaTitle})</span>
                  </Link>
                </p>)}
              </div>
          </section>
        </div>
      </section>
    </>
  );
};
export default ProfilePage;
