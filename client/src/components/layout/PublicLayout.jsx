import React from 'react';
import PublicNavbar from '../public/PublicNavbar';
import PublicFooter from '../public/PublicFooter';

const PublicLayout = ({ children }) => {
  return (
    <>
      <PublicNavbar />
      <main>
        {children}
      </main>
      <PublicFooter />
    </>
  );
};

export default PublicLayout;
