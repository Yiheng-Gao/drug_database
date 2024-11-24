/* eslint-disable */
'use client'
import React from 'react';
import {Layout, Menu } from 'antd';
import type { MenuProps } from 'antd';
import Link from 'next/link';

const { Header} = Layout;

const items: MenuProps['items'] = [
  {
    key: '1',
    label: (
      <Link href="/">
        Test Counts Analysis
      </Link>
    ),
  },
  {
    key: '2',
    label: (
      <Link href="/adulterants">
        Adulterants Analysis
      </Link>
    ),
  },
]

const JHIheader = ()=> {
  

  return (
    <Layout>
      <Header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1,
          width: '100%',
          display: 'flex',
        
          alignItems: 'center',
        }}
      >
        <Menu
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={['1']}
          items={items}
          style={{ flex: 1, minWidth: 0 }}
        />
        <div
          style={{
            color: 'white',
            fontSize: '18px',
            fontWeight: 'bold',
            textAlign: 'right',
            flex: 1,
          }}
        >
          THE J HEALTHCARE INITIATIVE
        </div>
      </Header>
      
    
    </Layout>
  );
}

export default JHIheader;