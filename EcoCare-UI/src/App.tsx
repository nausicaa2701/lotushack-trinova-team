/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './screens/Dashboard';
import { Bookings } from './screens/Bookings';
import { Explore } from './screens/Explore';
import { Vehicles } from './screens/Vehicles';
import { Analytics } from './screens/Analytics';

// PrimeReact Styles
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </Layout>
    </Router>
  );
}

