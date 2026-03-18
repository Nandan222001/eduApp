import React from 'react';
import { Text } from 'react-native';
import { Card } from '../../src/components/shared/Card';
import { renderWithProviders } from '../utils';

describe('Card Component', () => {
  it('should render card with children', () => {
    const { getByText } = renderWithProviders(
      <Card>
        <Text>Card Content</Text>
      </Card>
    );
    expect(getByText('Card Content')).toBeTruthy();
  });

  it('should render card with title', () => {
    const { getByText } = renderWithProviders(
      <Card title="Card Title">
        <Text>Card Content</Text>
      </Card>
    );
    expect(getByText('Card Title')).toBeTruthy();
    expect(getByText('Card Content')).toBeTruthy();
  });

  it('should apply custom container style', () => {
    const customStyle = { backgroundColor: 'red' };
    const { getByTestId } = renderWithProviders(
      <Card containerStyle={customStyle} testID="custom-card">
        <Text>Content</Text>
      </Card>
    );
    
    const card = getByTestId('custom-card');
    expect(card).toBeTruthy();
  });
});
